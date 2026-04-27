# PRD — System Bezpiecznego Logowania z 2FA (TOTP)

---

## 1. Informacje ogólne

| Pole                  | Wartość                                              |
| --------------------- | ---------------------------------------------------- |
| Nazwa projektu        | SecureAuth — System bezpiecznego logowania z 2FA     |
| Autorzy               | [Imię Nazwisko 1], [Imię Nazwisko 2]                 |
| Przedmiot             | Ochrona danych i bezpieczeństwo informacji           |
| Prowadzący            | mgr inż. Mariusz Łazarski                            |
| Data rozpoczęcia      | [DATA]                                               |
| Planowane zakończenie | [DATA]                                               |
| Wersja dokumentu      | 1.0                                                  |
| Faza                  | Faza 1 — TOTP · Faza 2 (opcjonalna) — Passkeys      |

---

## 2. Cel projektu

Zaprojektowanie i implementacja systemu uwierzytelniania użytkowników
z dwuskładnikową weryfikacją tożsamości (2FA) opartą o algorytm TOTP
(Time-based One-Time Password, RFC 6238).

Projekt ma na celu:

- Zademonstrowanie praktycznego działania 2FA w aplikacji webowej.
- Pokazanie mechanizmów ochrony danych uwierzytelniających (hashowanie, tokeny, rate limiting).
- Edukację autorów w zakresie bezpieczeństwa systemów logowania.
- Dostarczenie działającego prototypu z dokumentacją i testami.

---

## 3. Zakres projektu

### 3.1. Faza 1 — TOTP (zakres obowiązkowy)

| Funkcjonalność                         | Priorytet | Opis                                                            |
| -------------------------------------- | --------- | --------------------------------------------------------------- |
| Rejestracja użytkownika                | P0        | Formularz z walidacją, hashowanie hasła (bcrypt)                |
| Logowanie (email + hasło)              | P0        | Weryfikacja hasła, odpowiedź z flagą `requires2FA`              |
| Konfiguracja TOTP                      | P0        | Generacja sekretu, wyświetlenie QR code do zeskanowania         |
| Weryfikacja kodu TOTP                  | P0        | Walidacja 6-cyfrowego kodu, wydanie tokenu JWT                  |
| Autoryzacja żądań przez JWT            | P0        | Middleware sprawdzający token w nagłówku `Authorization`        |
| Chroniony panel użytkownika            | P0        | Strona dostępna wyłącznie po pełnym uwierzytelnieniu            |
| Rate limiting                          | P1        | Ograniczenie prób logowania i weryfikacji kodu (maks. 5/min)    |
| Blokada konta po N nieudanych próbach  | P1        | Tymczasowa blokada konta po 5 błędnych hasłach                  |
| Logowanie zdarzeń (audit log)          | P1        | Zapis akcji: login, failed\_login, 2fa\_success, 2fa\_fail      |
| Walidacja siły hasła                   | P2        | Min. 8 znaków, wielka litera, cyfra, znak specjalny             |
| Wylogowanie (invalidacja tokenu)       | P2        | Endpoint `/logout`, blacklist tokenu lub usunięcie z cookie     |

### 3.2. Faza 2 — Passkeys / WebAuthn (zakres opcjonalny)

| Funkcjonalność                         | Priorytet | Opis                                                            |
| -------------------------------------- | --------- | --------------------------------------------------------------- |
| Rejestracja Passkey                    | P3        | Generacja pary kluczy, zapis klucza publicznego                 |
| Logowanie przez Passkey (biometria)    | P3        | WebAuthn challenge-response z weryfikacją podpisu               |
| Wybór metody 2FA przez użytkownika     | P3        | Ekran ustawień: TOTP / Passkey / oba                            |
| Porównanie metod w raporcie            | P3        | Analiza bezpieczeństwa, wygody, odporności na phishing          |

> **Legenda priorytetów:**
> P0 = wymagane do zaliczenia · P1 = powinno być · P2 = miło mieć · P3 = rozszerzenie

---

## 4. Architektura systemu

### 4.1. Stos technologiczny

| Warstwa        | Technologia                    | Uzasadnienie                                 |
| -------------- | ------------------------------ | -------------------------------------------- |
| Frontend       | React (Vite) + TypeScript      | Popularny stack, szybki dev, typowanie        |
| Backend        | Node.js + Express + TypeScript | Spójność języka z frontendem                  |
| Baza danych    | SQLite (better-sqlite3)        | Zero konfiguracji, wystarczy do prototypu     |
| Auth — hasła   | bcrypt                         | Celowo wolny algorytm hashujący               |
| Auth — TOTP    | speakeasy                      | Biblioteka TOTP zgodna z RFC 6238             |
| Auth — tokeny  | jsonwebtoken (JWT)             | Standardowy mechanizm autoryzacji bezstanowej |
| QR Code        | qrcode                         | Generacja QR do zeskanowania w Google Auth    |
| Rate limiting  | express-rate-limit             | Ochrona przed brute force                     |
| Bezpieczeństwo | helmet                         | Bezpieczne nagłówki HTTP                      |

### 4.2. Struktura katalogów

```text
secure-auth/
├── client/                         # Frontend (React)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── TotpSetupPage.tsx
│   │   │   ├── TotpVerifyPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   ├── components/
│   │   │   ├── AuthForm.tsx
│   │   │   ├── QrCodeDisplay.tsx
│   │   │   ├── CodeInput.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── server/                         # Backend (Express)
│   ├── src/
│   │   ├── routes/
│   │   │   └── auth.routes.ts
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── middleware/
│   │   │   ├── verifyJwt.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── auditLogger.ts
│   │   ├── services/
│   │   │   ├── password.service.ts
│   │   │   ├── totp.service.ts
│   │   │   └── jwt.service.ts
│   │   ├── db/
│   │   │   ├── database.ts
│   │   │   └── schema.sql
│   │   ├── utils/
│   │   │   └── validators.ts
│   │   └── index.ts
│   └── package.json
│
├── docs/
│   ├── raport.md
│   └── prezentacja.pdf
│
├── PRD.md
├── TODO.md
└── README.md
```

### 4.3. Model bazy danych

```sql
CREATE TABLE users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    UNIQUE NOT NULL,
    password_hash   TEXT    NOT NULL,
    totp_secret     TEXT,                            -- NULL = 2FA nieskonfigurowane
    is_2fa_enabled  INTEGER DEFAULT 0,               -- 0 = false, 1 = true
    failed_attempts INTEGER DEFAULT 0,
    locked_until    TEXT,                             -- ISO 8601 datetime lub NULL
    created_at      TEXT    DEFAULT (datetime('now')),
    updated_at      TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE audit_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    action      TEXT    NOT NULL,                    -- REGISTER, LOGIN_SUCCESS, LOGIN_FAIL,
                                                     -- 2FA_SUCCESS, 2FA_FAIL, 2FA_ENABLED, LOGOUT
    ip_address  TEXT,
    user_agent  TEXT,
    details     TEXT,                                -- opcjonalny JSON
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4.4. Endpointy API

| Metoda | Ścieżka                   | Auth wymagany | Opis                                                      |
| ------ | -------------------------- | ------------- | ---------------------------------------------------------- |
| POST   | `/api/auth/register`       | ❌ Nie         | Rejestracja nowego użytkownika                             |
| POST   | `/api/auth/login`          | ❌ Nie         | Login (email + hasło) → temp token lub JWT                 |
| POST   | `/api/auth/verify-totp`    | 🔶 Temp token | Weryfikacja kodu TOTP → pełny JWT                          |
| POST   | `/api/auth/setup-totp`     | ✅ Full JWT    | Generacja sekretu TOTP + QR code                           |
| POST   | `/api/auth/confirm-totp`   | ✅ Full JWT    | Potwierdzenie konfiguracji TOTP (pierwszy kod)             |
| POST   | `/api/auth/logout`         | ✅ Full JWT    | Wylogowanie                                                |
| GET    | `/api/user/dashboard`      | ✅ Full JWT    | Chroniony zasób — dane użytkownika                         |
| GET    | `/api/user/audit-log`      | ✅ Full JWT    | Historia logowań użytkownika                               |

### 4.5. Flow uwierzytelniania

#### Rejestracja

```text
Register → Hash hasła (bcrypt, 12 rund) → Zapis do DB → Redirect do /login
```

#### Pierwsze logowanie (2FA jeszcze nieaktywne)

```text
Login → Hasło OK → Pełny JWT → Dashboard
                                  ↓
                    Baner: "Włącz 2FA dla bezpieczeństwa"
```

#### Konfiguracja 2FA

```text
Dashboard → "Włącz 2FA"
         → POST /setup-totp       → Backend generuje TOTP secret
         → Frontend wyświetla QR  → Użytkownik skanuje w Google Auth
         → Wpisuje pierwszy kod   → POST /confirm-totp
         → Backend potwierdza     → is_2fa_enabled = true
```

#### Logowanie z aktywnym 2FA

```text
Login → Hasło OK → Temp token (ważny 5 min, ograniczone uprawnienia)
     → Ekran kodu TOTP
     → Użytkownik wpisuje 6 cyfr
     → POST /verify-totp → Backend weryfikuje
     → Pełny JWT         → Dashboard
```

#### Nieudane logowanie

```text
Login → Złe hasło → failed_attempts++ → Audit log (LOGIN_FAIL)
                  → Po 5 próbach     → locked_until = now + 15 min
                                     → HTTP 423 Locked
```

---

## 5. Wymagania bezpieczeństwa

| Mechanizm                    | Implementacja                                                         |
| ---------------------------- | --------------------------------------------------------------------- |
| Przechowywanie haseł         | bcrypt z 12 rundami, nigdy plaintext                                  |
| TOTP secret                  | Przechowywany w bazie (opcjonalnie zaszyfrowany AES-256)              |
| JWT (pełny)                  | Algorytm HS256, ważność 15 minut                                     |
| Temp token (pre-2FA)         | Ważność 5 minut, uprawnia TYLKO do `/verify-totp`                     |
| Rate limiting — login        | Maks. 5 prób / minutę / IP                                           |
| Rate limiting — TOTP verify  | Maks. 3 próby / minutę / użytkownik                                  |
| Blokada konta                | Po 5 nieudanych próbach hasła → blokada na 15 minut                  |
| Nagłówki HTTP                | helmet.js (X-Frame-Options, CSP, HSTS, X-Content-Type-Options)       |
| CORS                         | Ograniczone do origin frontendu (`http://localhost:5173`)             |
| Input sanitization           | Walidacja formatu email, parametryzowane zapytania SQL                |
| Audit trail                  | Każda akcja auth logowana z: userId, IP, user-agent, timestamp        |

---

## 6. Wymagania niefunkcjonalne

| Wymaganie            | Wartość docelowa                                     |
| -------------------- | ---------------------------------------------------- |
| Czas odpowiedzi API  | < 500 ms (z wyjątkiem bcrypt hash ~300 ms)           |
| Kompatybilność       | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+        |
| Responsywność UI     | Desktop + podstawowa obsługa mobile                   |
| Środowisko           | Działanie lokalne (localhost), bez wymogów hostingu   |

---

## 7. Podział odpowiedzialności

| Obszar                                    | Osoba A (Frontend) | Osoba B (Backend) |
| ----------------------------------------- | :----------------: | :---------------: |
| Strona rejestracji                        |         ✅         |                   |
| Strona logowania                          |         ✅         |                   |
| Ekran konfiguracji 2FA (QR code)          |         ✅         |                   |
| Ekran wpisywania kodu TOTP                |         ✅         |                   |
| Panel użytkownika (Dashboard)             |         ✅         |                   |
| Routing chroniony (ProtectedRoute)        |         ✅         |                   |
| Obsługa JWT w requestach (axios)          |         ✅         |                   |
| Konfiguracja serwera Express              |                    |        ✅         |
| Schemat bazy danych (SQLite)              |                    |        ✅         |
| Endpointy auth (register, login)          |                    |        ✅         |
| Logika TOTP (generacja, weryfikacja)      |                    |        ✅         |
| JWT (generacja, middleware weryfikacji)    |                    |        ✅         |
| Rate limiting + blokada konta             |                    |        ✅         |
| Audit logging (middleware + endpoint)     |                    |        ✅         |
| Testy manualne E2E                        |         ✅         |        ✅         |
| Testy API (Postman / automatyczne)        |                    |        ✅         |
| Raport — część frontend + UX             |         ✅         |                   |
| Raport — część backend + security        |                    |        ✅         |
| Raport — wstęp i wnioski                 |         ✅         |        ✅         |

---

## 8. Plan testowania

### 8.1. Testy funkcjonalne

| ID   | Scenariusz                              | Input                    | Oczekiwany rezultat                  |
| ---- | --------------------------------------- | ------------------------ | ------------------------------------ |
| F-01 | Rejestracja z poprawnymi danymi         | email + silne hasło      | 201 — konto utworzone                |
| F-02 | Rejestracja z istniejącym emailem       | duplikat emaila          | 409 — "Email już istnieje"           |
| F-03 | Rejestracja ze słabym hasłem            | `"123"`                  | 400 — błąd walidacji                 |
| F-04 | Login poprawny (bez 2FA)                | poprawne dane            | JWT + dostęp do dashboardu           |
| F-05 | Login poprawny (z 2FA)                  | poprawne dane            | Temp token + ekran kodu TOTP         |
| F-06 | Login z błędnym hasłem                  | złe hasło                | 401 — failed\_attempts++             |
| F-07 | Konfiguracja TOTP                       | klik "Włącz 2FA"        | QR code wyświetlony                  |
| F-08 | Potwierdzenie TOTP poprawnym kodem      | kod z Google Auth        | 2FA aktywowane                       |
| F-09 | Weryfikacja TOTP poprawnym kodem        | kod z Google Auth        | JWT wydany → dashboard               |
| F-10 | Weryfikacja TOTP błędnym kodem          | `"000000"`               | 401 — odmowa                         |
| F-11 | Dostęp do dashboardu bez JWT            | brak nagłówka Auth       | 401 — Unauthorized                   |
| F-12 | Dostęp do dashboardu z wygasłym JWT     | token po 15+ min         | 401 — Unauthorized                   |

### 8.2. Testy bezpieczeństwa

| ID   | Atak                      | Metoda testowania                   | Oczekiwana obrona                    |
| ---- | ------------------------- | ----------------------------------- | ------------------------------------ |
| S-01 | Brute force hasła         | 10× błędne hasło (curl / Postman)   | Blokada konta po 5. próbie          |
| S-02 | Brute force TOTP          | 5× losowy kod                       | Rate limit po 3. próbie             |
| S-03 | SQL Injection             | `email: "' OR 1=1--"`              | Brak wycieku, błąd walidacji         |
| S-04 | Plaintext w bazie         | Podgląd bazy SQLite                 | Widoczny tylko hash bcrypt           |
| S-05 | Modyfikacja JWT payload   | Ręczna zmiana base64 + wysłanie     | Signature invalid → 401             |
| S-06 | Temp token na dashboard   | Temp token w nagłówku Authorization | 403 — niewystarczające uprawnienia   |
| S-07 | Replay starego kodu TOTP  | Kod sprzed 60+ sekund               | Odrzucony (okno 30s ± 1)            |

---

## 9. Deliverables

| Element          | Format               | Zawartość                                                       |
| ---------------- | -------------------- | --------------------------------------------------------------- |
| Kod źródłowy     | Repozytorium Git     | Frontend + Backend + README z instrukcją uruchomienia            |
| Raport           | PDF / Markdown       | 3–5 stron: teoria, architektura, testy, wnioski                 |
| Prezentacja      | Demo na żywo         | Register → Login → Setup 2FA → Login z 2FA → Dashboard          |

---

## 10. Ryzyka

| Ryzyko                                    | Prawdopodobieństwo | Wpływ  | Mitygacja                                     |
| ----------------------------------------- | :-----------------: | :----: | --------------------------------------------- |
| Brak doświadczenia z auth                 |       Wysokie       | Średni | Szczegółowe TODO, gotowe biblioteki            |
| Problemy z CORS (front ↔ back)            |       Średnie       | Niski  | Konfiguracja `cors` w Express od początku      |
| Trudności z testowaniem TOTP (timing)     |       Niskie        | Niski  | speakeasy: parametr `window: 1` (±30 s)        |
| Brak czasu na Fazę 2 (Passkeys)          |       Średnie       | Niski  | Faza 2 jest opcjonalna, Faza 1 jest kompletna  |

---

## 11. Słownik pojęć

| Pojęcie        | Definicja                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------- |
| 2FA            | Two-Factor Authentication — uwierzytelnianie dwoma różnymi czynnikami                              |
| TOTP           | Time-based One-Time Password — jednorazowy kod generowany na podstawie czasu i wspólnego sekretu    |
| bcrypt         | Algorytm hashowania haseł, celowo wolny, odporny na ataki brute force                             |
| JWT            | JSON Web Token — podpisany token autoryzacyjny przesyłany w nagłówku HTTP                          |
| Rate limiting  | Ograniczenie liczby żądań w jednostce czasu per IP / użytkownik                                    |
| Audit log      | Dziennik zdarzeń bezpieczeństwa (kto, co, kiedy, skąd)                                            |
| Temp token     | Tymczasowy token o ograniczonych uprawnieniach, wydawany po poprawnym haśle przed weryfikacją 2FA  |
