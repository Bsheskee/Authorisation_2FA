# Authorisation_2FA

# 2FA — Kompletne wyjaśnienie

## Czym jest 2FA?

**Two-Factor Authentication** (uwierzytelnianie dwuskładnikowe) to mechanizm, który wymaga od użytkownika potwierdzenia tożsamości na **dwa różne sposoby** zanim uzyska dostęp.

### Filozofia za tym stojąca

Bezpieczeństwo opiera się na trzech kategoriach:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1. COŚ, CO WIESZ      →  hasło, PIN, odpowiedź    │
│                            na pytanie zabezpieczające│
│                                                     │
│  2. COŚ, CO MASZ        →  telefon, klucz U2F,     │
│                            karta smartcard, token    │
│                                                     │
│  3. COŚ, CZYM JESTEŚ    →  odcisk palca, twarz,    │
│                            tęczówka oka, głos       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**2FA = kombinacja dwóch RÓŻNYCH kategorii**

Przykłady:
- ✅ Hasło (wiesz) + kod z aplikacji (masz) → **prawdziwe 2FA**
- ✅ Hasło (wiesz) + odcisk palca (jesteś) → **prawdziwe 2FA**
- ❌ Hasło + pytanie zabezpieczające → **NIE jest 2FA** (obie to "coś, co wiesz")

### Dlaczego samo hasło nie wystarcza?

```
Atak                    Samo hasło    Hasło + 2FA
─────────────────────   ──────────    ───────────
Phishing                ❌ złamane     ✅ chronione*
Brute force             ❌ złamane     ✅ chronione
Credential stuffing     ❌ złamane     ✅ chronione
Wyciek bazy danych      ❌ złamane     ✅ chronione
Keylogger               ❌ złamane     ✅ chronione
Kradzież telefonu       ✅ bezpieczne  ⚠️ zależy

* przy TOTP phishing nadal możliwy, Passkeys/U2F odporne
```

---

## Metody 2FA — od najsłabszej do najsilniejszej

### 1. SMS OTP (najsłabsza)
```
Użytkownik loguje się → serwer wysyła SMS z kodem → użytkownik wpisuje kod

Wady:
- SIM swapping (ktoś przejmuje Twój numer)
- przechwycenie SMS (protokół SS7 jest dziurawy)
- opóźnienia w dostarczeniu
```

### 2. TOTP — Time-based One-Time Password ⭐ (to zaimplementujecie)
```
Jak działa:
1. Serwer generuje SECRET KEY (np. "JBSWY3DPEHPK3PXP")
2. Użytkownik skanuje QR code w aplikacji (Google Authenticator, Authy)
3. Algorytm: HMAC-SHA1(secret, czas/30s) → 6-cyfrowy kod
4. Kod zmienia się co 30 sekund
5. Serwer zna ten sam secret → może zweryfikować kod

Dlaczego dobry:
- Działa offline
- Nie wymaga SMS
- Standardowy algorytm (RFC 6238)
```

### 3. Push Notification
```
Logowanie → powiadomienie na telefon → "Czy to Ty?" → Tak/Nie
(jak w aplikacjach bankowych)
```

### 4. U2F / FIDO2 / Passkeys (najsilniejsza)
```
Klucz sprzętowy (YubiKey) lub biometria wbudowana w urządzenie
Oparte na kryptografii asymetrycznej
Odporne na phishing (klucz jest powiązany z domeną)
```

---

## Architektura Waszego projektu — warstwa po warstwie

```
╔══════════════════════════════════════════════════════════════╗
║                    WARSTWA PREZENTACJI                       ║
║                      (Frontend)                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   ┌──────────┐  ┌──────────────┐  ┌───────────────────┐    ║
║   │ Rejestr.  │  │  Logowanie   │  │  Panel użytkownika│    ║
║   │ formularz │  │  formularz   │  │  (chroniony)      │    ║
║   └──────────┘  └──────────────┘  └───────────────────┘    ║
║         │              │                    │                ║
║         │         ┌────┴─────┐              │                ║
║         │         │ Krok 1:  │              │                ║
║         │         │ email +  │              │                ║
║         │         │ hasło    │              │                ║
║         │         ├──────────┤              │                ║
║         │         │ Krok 2:  │              │                ║
║         │         │ kod TOTP │              │                ║
║         │         └──────────┘              │                ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                     WARSTWA API                              ║
║                    (Backend)                                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   POST /api/auth/register                                    ║
║     → walidacja danych                                       ║
║     → hashowanie hasła (bcrypt, 12 rund)                     ║
║     → zapis do bazy                                          ║
║                                                              ║
║   POST /api/auth/login                                       ║
║     → weryfikacja email + hasło                              ║
║     → jeśli OK → zwróć "wymaga 2FA"                         ║
║     → NIE wydawaj jeszcze tokenu JWT                         ║
║                                                              ║
║   POST /api/auth/verify-2fa                                  ║
║     → weryfikacja kodu TOTP                                  ║
║     → jeśli OK → wydaj token JWT                             ║
║     → jeśli NIE → odmowa + log próby                         ║
║                                                              ║
║   POST /api/auth/setup-2fa                                   ║
║     → generuj secret TOTP                                    ║
║     → generuj QR code                                        ║
║     → zwróć do frontendu                                     ║
║                                                              ║
║   GET /api/protected/dashboard                               ║
║     → sprawdź JWT w nagłówku                                 ║
║     → jeśli ważny → zwróć dane                               ║
║     → jeśli nie → 401 Unauthorized                           ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                  WARSTWA BEZPIECZEŃSTWA                      ║
║                  (Middleware / Logika)                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  ║
║   │  Rate Limiting   │  │  JWT Verify  │  │  CORS Policy │  ║
║   │  (maks. 5 prób  │  │  (sprawdź    │  │  (kto może   │  ║
║   │   na minutę)    │  │   token)     │  │   odpytywać) │  ║
║   └─────────────────┘  └──────────────┘  └──────────────┘  ║
║                                                              ║
║   ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  ║
║   │  Input Sanitize  │  │  Helmet.js   │  │  Audit Log   │  ║
║   │  (ochrona XSS/  │  │  (nagłówki   │  │  (logowanie  │  ║
║   │   SQL Injection) │  │   HTTP)      │  │   zdarzeń)   │  ║
║   └─────────────────┘  └──────────────┘  └──────────────┘  ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                   WARSTWA DANYCH                             ║
║                   (Baza danych)                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   Tabela: users                                              ║
║   ┌────────────────────────────────────────────────────┐    ║
║   │ id
             │ email          │ password_hash         │    ║
║   │ totp_secret    │ is_2fa_enabled │ created_at      │    ║
║   │ failed_attempts│ locked_until   │                 │    ║
║   └────────────────────────────────────────────────────┘    ║
║                                                              ║
║   Tabela: audit_logs                                         ║
║   ┌────────────────────────────────────────────────────┐    ║
║   │ id │ user_id │ action │ ip_address │ timestamp     │    ║
║   │ success (bool) │ details (JSON)                    │    ║
║   └────────────────────────────────────────────────────┘    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Cały flow logowania — krok po kroku

```
UŻYTKOWNIK                    FRONTEND                    BACKEND                     BAZA
    │                            │                           │                          │
    │  1. Wpisuje email+hasło    │                           │                          │
    │ ─────────────────────────► │                           │                          │
    │                            │  2. POST /login           │                          │
    │                            │  {email, password}        │                          │
    │                            │ ────────────────────────► │                          │
    │                            │                           │  3. Znajdź usera         │
    │                            │                           │ ───────────────────────► │
    │                            │                           │  4. Porównaj hash        │
    │                            │                           │ ◄─────────────────────── │
    │                            │                           │                          │
    │                            │  5. {requires2FA: true,   │                          │
    │                            │      tempToken: "xyz"}    │                          │
    │                            │ ◄──────────────────────── │                          │
    │                            │                           │                          │
    │  6. Ekran "wpisz kod 2FA" │                           │                          │
    │ ◄───────────────────────── │                           │                          │
    │                            │                           │                          │
    │  7. Otwiera Google Auth    │                           │                          │
    │     Odczytuje kod: 847293  │                           │                          │
    │                            │                           │                          │
    │  8. Wpisuje kod            │                           │                          │
    │ ─────────────────────────► │                           │                          │
    │                            │  9. POST /verify-2fa      │                          │
    │                            │  {tempToken, code}        │                          │
    │                            │ ────────────────────────► │                          │
    │                            │                           │  10. Sprawdź TOTP secret │
    │                            │                           │ ───────────────────────► │
    │                            │                           │  11. Oblicz oczekiwany   │
    │                            │                           │      kod i porównaj      │
    │                            │                           │                          │
    │                            │  12. {accessToken: "JWT"} │                          │
    │                            │ ◄──────────────────────── │                          │
    │                            │                           │                          │
    │  13. Przekierowanie do     │                           │                          │
    │      panelu użytkownika    │                           │                          │
    │ ◄───────────────────────── │                           │                          │
```

---

## Podział pracy między Wami

```
╔══════════════════════════════╦══════════════════════════════════╗
║       OSOBA A (Frontend)     ║        OSOBA B (Backend)         ║
╠══════════════════════════════╬══════════════════════════════════╣
║                              ║                                  ║
║  Tydzień 1:                  ║  Tydzień 1:                      ║
║  • Strona rejestracji        ║  • Konfiguracja serwera Express  ║
║  • Strona logowania          ║  • Model bazy danych (users)     ║
║  • Strona wpisywania         ║  • Endpoint POST /register       ║
║    kodu 2FA                  ║    (z bcrypt)                    ║
║                              ║  • Endpoint POST /login          ║
║                              ║                                  ║
║  Tydzień 2:                  ║  Tydzień 2:                      ║
║  • Ekran konfiguracji 2FA   ║  • Endpoint POST /setup-2fa      ║
║    (wyświetlenie QR code)    ║    (generacja TOTP secret + QR)  ║
║  • Obsługa JWT               ║  • Endpoint POST /verify-2fa     ║
║    (localStorage/cookie,     ║  • Middleware JWT                ║
║     wysyłanie w nagłówku)    ║  • Rate limiting                 ║
║  • Panel "chroniony"         ║  • Audit logging                 ║
║                              ║                                  ║
║  Tydzień 3:                  ║  Tydzień 3:                      ║
║  • Testy manualne UI         ║  • Testy API                     ║
║  • Raport (część frontowa)   ║  • Raport (część backendowa)     ║
║                              ║                                  ║
╚══════════════════════════════╩══════════════════════════════════╝
```

---

## Testowanie projektu

### 1. Testy funkcjonalne (czy działa?)

```
┌──────────────────────────────────────────────────────────────┐
│  TEST                              │  OCZEKIWANY REZULTAT    │
├──────────────────────────────────────────────────────────────┤
│  Rejestracja z poprawnym email     │  Konto utworzone,        │
│  i silnym hasłem                   │  hasło zahashowane       │
├──────────────────────────────────────────────────────────────┤
│  Rejestracja z już istniejącym     │  Błąd "email już         │
│  emailem                           │  istnieje"               │
├──────────────────────────────────────────────────────────────┤
│  Login z poprawnym hasłem          │  Przejście do ekranu     │
│  (bez 2FA)                         │  konfiguracji 2FA        │
├──────────────────────────────────────────────────────────────┤
│  Login z poprawnym hasłem          │  Żądanie kodu TOTP       │
│  (z 2FA włączonym)                 │                          │
├──────────────────────────────────────────────────────────────┤
│  Wpisanie poprawnego kodu TOTP     │  Dostęp do panelu        │
├──────────────────────────────────────────────────────────────┤
│  Wpisanie BŁĘDNEGO kodu TOTP       │  Odmowa dostępu          │
├──────────────────────────────────────────────────────────────┤
│  Dostęp do /dashboard bez JWT      │  401 Unauthorized        │
├──────────────────────────────────────────────────────────────┤
│  Dostęp do /dashboard z ważnym JWT │  200 OK + dane           │
├──────────────────────────────────────────────────────────────┤
│  Dostęp z wygasłym JWT             │  401 Unauthorized        │
└──────────────────────────────────────────────────────────────┘
```

### 2. Testy bezpieczeństwa (czy jest bezpieczne?)

```
┌──────────────────────────────────────────────────────────────────┐
│  ATAK                          │  JAK TESTOWAĆ     │ OCZEKIWANE  │
├──────────────────────────────────────────────────────────────────┤
│                                │                   │             │
│  Brute force hasła             │  Wyślij 10x       │ Blokada po  │
│                                │  błędne hasło     │ 5. próbie   │
│                                │  (Postman/curl)   │             │
│                                │                   │             │
│  Brute force TOTP              │  Wyślij losowe    │ Rate limit  │
│                                │  kody 6-cyfrowe   │ po 3 próbach│
│                                │                   │             │
│  SQL Injection                 │  email: "' OR     │ Brak wycieku│
│                                │  1=1--"           │ danych      │
│                                │                   │             │
│  Sprawdzenie hasha             │  Zajrzyj do bazy  │ Hasło NIE   │
│                                │  danych           │ w plaintext │
│                                │                   │ bcrypt hash │
│                                │                   │             │
│  Kradzież JWT                  │  Skopiuj token,   │ Token wygasa│
│                                │  użyj po 15 min   │ po 15 min   │
│                                │                   │             │
│  Brak tokenu                   │  GET /dashboard   │ 401 błąd    │
│                                │  bez nagłówka     │             │
│                                │  Authorization    │             │
│                                │                   │             │
│  Zmodyfikowany JWT             │  Zmień payload    │ Odrzucony   │
│                                │  ręcznie          │ (signature  │
│                                │                   │  invalid)   │
└──────────────────────────────────────────────────────────────────┘
```

### 3. Narzędzia do testowania

```
Testy API:
  → Postman (ręczne wysyłanie requestów)
  → curl z terminala

Testy automatyczne (opcjonalne, ale robi wrażenie):
  → Jest + Supertest (Node.js)

  Przykład:
  ─────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('powinien odmówić dostępu przy złym haśle', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.pl', password: 'zle' });
      
      expect(res.status).toBe(401);
    });

    it('powinien wymagać 2FA po poprawnym haśle', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.pl', password: 'Dobre123!' });
      
      expect(res.body.requires2FA).toBe(true);
    });
  });
  ─────────────────────────────────────────

Sprawdzenie hasha w bazie:
  → SQLite Browser / pgAdmin
  → Upewnij się, że widzisz coś takiego:
    $2b$12$LJ3m4ys8Kqx... (NIE "mojehaslo123")

Test TOTP:
  → Google Authenticator na telefonie
  → Lub strona: https://totp.danhersam.com/
```

---

## Kluczowe biblioteki (Node.js)

```javascript
// Te 5 bibliotek załatwia 90% projektu:

bcrypt          // hashowanie haseł
speakeasy       // generowanie i weryfikacja TOTP
qrcode          // generowanie QR do zeskanowania
jsonwebtoken    // tworzenie i weryfikacja JWT
express-rate-limit  // ochrona przed brute force

// Instalacja:
npm install bcrypt speakeasy qrcode jsonwebtoken express-rate-limit
```

---

## Struktura raportu (3–5 stron)

```
1. Wstęp
   - Czym jest 2FA i dlaczego jest potrzebne
   - Cel projektu

2. Opis techniczny
   - Architektura systemu (diagram)
   - Użyte technologie
   - Opis endpointów API

3. Mechanizmy bezpieczeństwa
   - Hashowanie haseł (bcrypt)
   - TOTP — jak działa algorytm
   - JWT — autoryzacja
   - Rate limiting
   - Logowanie zdarzeń

4. Testowanie
   - Scenariusze testowe
   - Wyniki testów bezpieczeństwa
   - Screenshoty

5. Wnioski i rekomendacje
   - Co chroni, a czego nie chroni
   - Możliwości rozbudowy (passkeys, biometria)

