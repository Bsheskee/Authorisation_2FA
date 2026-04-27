
# TODO — SecureAuth Project

> **Legenda statusów:**
> - [ ] Do zrobienia
> - [~] W trakcie
> - [x] Zrobione
>

Obecnie test wprowadzenia 2FA działa, ale przy próbie resignu/ loginu kod z autenticatora nie wchodzi. 
Podstawowe use case:
1. User tworzy konto.
2. Po stworzeniu konta dodaje autoryzacje 2FA.
3. Pobiera dowolną aplikacje na telefon do 2FA.
4. Skanuje kod QR za pomocą aplikacji.
5. Wpisuje kod z applikacji w oknie do autoryzacji (na lokalnym hoście w aplikacji do autoryzacji)
6. Autoryzacja powinna przejśc pomyślnie. 
7. Next step: działający login. 

> **Legenda priorytetów:**
> 🔴 P0 (wymagane) · 🟡 P1 (powinno być) · 🟢 P2 (miło mieć)

---

## Faza 0 — Setup projektu

### Inicjalizacja repozytoriów i narzędzi
- [ ] 🔴 Utworzyć repozytorium Git (GitHub/GitLab)
- [ ] 🔴 Utworzyć strukturę katalogów (`client/`, `server/`, `docs/`)
- [ ] 🔴 Dodać `.gitignore` (node_modules, .env, *.db)
- [ ] 🔴 Utworzyć plik `.env.example` z wymaganymi zmiennymi

### Backend — inicjalizacja
- [ ] 🔴 `npm init` w `server/`
- [ ] 🔴 Zainstalować zależności:
npm install express typescript ts-node @types/express
npm install bcrypt @types/bcrypt
npm install speakeasy @types/speakeasy
npm install qrcode @types/qrcode
npm install jsonwebtoken @types/jsonwebtoken
npm install better-sqlite3 @types/better-sqlite3
npm install express-rate-limit
npm install helmet cors
npm install dotenv
npm install -D nodemon

text
- [ ] 🔴 Skonfigurować `tsconfig.json`
- [ ] 🔴 Skonfigurować `nodemon.json` (watch na `src/`)
- [ ] 🔴 Dodać skrypty do `package.json`:
- `dev` → `nodemon`
- `build` → `tsc`
- `start` → `node dist/index.js`
- [ ] 🔴 Utworzyć `src/index.ts` z podstawowym serwerem Express (port 3001)
- [ ] 🔴 Skonfigurować CORS (origin: `http://localhost:5173`)
- [ ] 🔴 Skonfigurować helmet
- [ ] 🔴 Zweryfikować: `npm run dev` → serwer startuje, odpowiada na GET `/health`

### Frontend — inicjalizacja
- [ ] 🔴 `npm create vite@latest client -- --template react-ts`
- [ ] 🔴 Zainstalować zależności:
npm install react-router-dom axios

text
- [ ] 🔴 Skonfigurować podstawowy routing (React Router):
- `/register`
- `/login`
- `/login/verify-totp`
- `/setup-totp`
- `/dashboard`
- [ ] 🔴 Utworzyć placeholder pages (puste komponenty z nagłówkiem)
- [ ] 🔴 Utworzyć `services/api.ts` z bazowym klientem axios (`baseURL: http://localhost:3001/api`)
- [ ] 🔴 Zweryfikować: `npm run dev` → frontend startuje, routing działa

---

## Faza 1A — Rejestracja i logowanie (bez 2FA)

### Backend — baza danych
- [ ] 🔴 Utworzyć `src/db/schema.sql` z tabelami `users` i `audit_logs`
- [ ] 🔴 Utworzyć `src/db/database.ts`:
- Inicjalizacja SQLite (better-sqlite3)
- Funkcja `initDb()` — wykonanie schema.sql przy starcie
- Eksport instancji `db`
- [ ] 🔴 Wywołać `initDb()` w `index.ts`
- [ ] 🔴 Zweryfikować: przy starcie serwera tworzy się plik `database.db`

### Backend — serwis haseł
- [ ] 🔴 Utworzyć `src/services/password.service.ts`:
- `hashPassword(plain: string): Promise<string>` — bcrypt, 12 rund
- `verifyPassword(plain: string, hash: string): Promise<boolean>`
- [ ] 🔴 Ręczny test: zahashować hasło, zweryfikować, sprawdzić że hash ≠ plaintext

### Backend — serwis JWT
- [ ] 🔴 Utworzyć `src/services/jwt.service.ts`:
- `generateToken(payload, expiresIn): string`
- `verifyToken(token): payload | null`
- Dwa typy tokenów:
  - `full` — ważność 15 min, pełny dostęp
  - `temp` — ważność 5 min, pole `type: 'temp'`, uprawnia tylko do verify-totp
- [ ] 🔴 Dodać `JWT_SECRET` do `.env` (min. 32 znaki, losowy ciąg)

### Backend — walidatory
- [ ] 🔴 Utworzyć `src/utils/validators.ts`:
- `validateEmail(email): boolean` — format email
- `validatePassword(password): { valid: boolean, errors: string[] }`:
  - min. 8 znaków
  - min. 1 wielka litera
  - min. 1 cyfra
  - min. 1 znak specjalny

### Backend — rejestracja
- [ ] 🔴 Utworzyć `POST /api/auth/register` w `auth.controller.ts`:
1. Walidacja inputu (email, password)
2. Sprawdzenie czy email już istnieje → 409
3. Hash hasła (bcrypt)
4. Zapis do tabeli `users`
5. Zapis audit log: `REGISTER`
6. Odpowiedź: 201 `{ message: "Konto utworzone" }`
- [ ] 🔴 Testy w Postman:
- Rejestracja poprawna → 201
- Duplikat emaila → 409
- Słabe hasło → 400
- Sprawdzić w bazie: hasło to hash, NIE plaintext

### Backend — logowanie (krok 1 — hasło)
- [ ] 🔴 Utworzyć `POST /api/auth/login` w `auth.controller.ts`:
1. Walidacja inputu
2. Znalezienie usera po emailu → 401 jeśli nie istnieje
3. Sprawdzenie blokady (`locked_until`) → 423 jeśli zablokowany
4. Weryfikacja hasła (bcrypt)
5. Jeśli błędne: `failed_attempts++`, audit log `LOGIN_FAIL`
   - Jeśli `failed_attempts >= 5` → ustaw `locked_until = now + 15 min`
6. Jeśli poprawne: `failed_attempts = 0`
   - Jeśli `is_2fa_enabled = false`:
     - Wydaj pełny JWT → `{ token, requires2FA: false }`
   - Jeśli `is_2fa_enabled = true`:
     - Wydaj temp token → `{ tempToken, requires2FA: true }`
7. Audit log: `LOGIN_SUCCESS` lub `LOGIN_FAIL`
- [ ] 🔴 Testy w Postman:
- Poprawne dane (bez 2FA) → JWT
- Błędne hasło → 401
- 5x błędne → 423 locked
- Odczekać 15 min (lub ręcznie zresetować) → odblokowane

### Backend — middleware JWT
- [ ] 🔴 Utworzyć `src/middleware/verifyJwt.ts`:
- Odczytaj nagłówek `Authorization: Bearer <token>`
- Zweryfikuj token → `req.user = payload`
- Brak/błędny token → 401
- [ ] 🔴 Utworzyć wariant `requireFullToken`:
- Sprawdź że `payload.type !== 'temp'` → 403 jeśli temp

### Backend — chroniony endpoint
- [ ] 🔴 Utworzyć `GET /api/user/dashboard`:
- Middleware: `verifyJwt` + `requireFullToken`
- Odpowiedź: dane użytkownika (email, is_2fa_enabled, created_at)
- [ ] 🔴 Testy w Postman:
- Bez tokenu → 401
- Z temp tokenem → 403
- Z pełnym JWT → 200 + dane

### Frontend — rejestracja
- [ ] 🔴 Implementacja `RegisterPage.tsx`:
- Formularz: email, hasło, powtórz hasło
- Walidacja po stronie klienta (siła hasła, zgodność haseł)
- Wywołanie `POST /api/auth/register`
- Obsługa błędów (409 duplikat, 400 walidacja)
- Sukces → redirect do `/login`

### Frontend — logowanie
- [ ] 🔴 Implementacja `LoginPage.tsx`:
- Formularz: email, hasło
- Wywołanie `POST /api/auth/login`
- Jeśli `requires2FA: false`:
  - Zapisz JWT (localStorage lub cookie)
  - Redirect do `/dashboard`
- Jeśli `requires2FA: true`:
  - Zapisz tempToken w stanie (NIE w localStorage)
  - Redirect do `/login/verify-totp`
- Obsługa błędów (401, 423 locked)

### Frontend — AuthContext
- [ ] 🔴 Utworzyć `context/AuthContext.tsx`:
- Stan: `user`, `token`, `isAuthenticated`
- Metody: `login()`, `logout()`, `setToken()`
- Przy starcie: sprawdź czy token w storage jest ważny

### Frontend — ProtectedRoute
- [ ] 🔴 Utworzyć `components/ProtectedRoute.tsx`:
- Sprawdź `isAuthenticated` z AuthContext
- Jeśli nie → redirect do `/login`

### Frontend — Dashboard
- [ ] 🔴 Implementacja `DashboardPage.tsx`:
- Owinięty w `ProtectedRoute`
- Wywołanie `GET /api/user/dashboard` z tokenem JWT
- Wyświetlenie danych użytkownika
- Jeśli `is_2fa_enabled = false` → baner "Włącz 2FA"
- Przycisk "Wyloguj" → usunięcie tokenu, redirect do `/login`

### ✅ Checkpoint Fazy 1A
- [ ] Rejestracja → Logowanie → Dashboard działa end-to-end
- [ ] Hasła zahashowane w bazie
- [ ] JWT chroni dashboard
- [ ] Błędne logowanie → audit log + blokada po 5 próbach

---

## Faza 1B — TOTP (2FA)

### Backend — serwis TOTP
- [ ] 🔴 Utworzyć `src/services/totp.service.ts`:
- `generateSecret(email: string)`:
  - `speakeasy.generateSecret({ name: 'SecureAuth:' + email })`
  - Zwraca `{ secret: base32, otpauthUrl }`
- `generateQrCode(otpauthUrl: string): Promise<string>`:
  - `qrcode.toDataURL(otpauthUrl)`
  - Zwraca base64 image
- `verifyCode(secret: string, code: string): boolean`:
  - `speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 1 })`
  - `window: 1` = akceptuje kod z ±30s

### Backend — konfiguracja TOTP
- [ ] 🔴 Utworzyć `POST /api/auth/setup-totp`:
- Middleware: `verifyJwt` + `requireFullToken`
- Generuj secret → zapisz tymczasowo (w tabeli `users.totp_secret`, ale `is_2fa_enabled` jeszcze `false`)
- Generuj QR code
- Odpowiedź: `{ qrCode: "data:image/png;base64,..." }`
- [ ] 🔴 Utworzyć `POST /api/auth/confirm-totp`:
- Middleware: `verifyJwt` + `requireFullToken`
- Odbierz kod od użytkownika
- Zweryfikuj kodem z `users.totp_secret`
- Jeśli OK → ustaw `is_2fa_enabled = true`
- Audit log: `2FA_ENABLED`
- Odpowiedź: `{ message: "2FA aktywowane" }`
- [ ] 🔴 Testy w Postman:
- Setup → dostać QR → zeskanować w Google Auth → wpisać kod → confirm → 2FA aktywne
- Zły kod → 401

### Backend — weryfikacja TOTP przy logowaniu
- [ ] 🔴 Utworzyć `POST /api/auth/verify-totp`:
- Wymagany: temp token (z `type: 'temp'`)
- Odbierz `code` z body
- Pobierz usera z `tempToken.userId`
- Zweryfikuj kod TOTP
- Jeśli OK:
  - Wydaj pełny JWT
  - Audit log: `2FA_SUCCESS`
- Jeśli błędny:
  - Audit log: `2FA_FAIL`
  - Rate limit: po 3 błędnych → 429
- Odpowiedź: `{ token }` lub `{ error }`
- [ ] 🔴 Testy w Postman:
- Login → temp token → verify-totp z kodem z Google Auth → pełny JWT
- Błędny kod → 401
- 3x błędny kod → 429

### Frontend — Setup TOTP
- [ ] 🔴 Implementacja `TotpSetupPage.tsx`:
- Przycisk "Generuj kod QR"
- Wywołanie `POST /api/auth/setup-totp`
- Wyświetlenie QR code (tag `<img src={qrCode} />`)
- Instrukcja: "Zeskanuj kod w Google Authenticator"
- Input na 6-cyfrowy kod weryfikacyjny
- Wywołanie `POST /api/auth/confirm-totp`
- Sukces → komunikat + redirect do dashboard

### Frontend — weryfikacja TOTP przy logowaniu
- [ ] 🔴 Implementacja `TotpVerifyPage.tsx`:
- Input na 6 cyfr (auto-focus, auto-submit po 6 cyfrach)
- Wywołanie `POST /api/auth/verify-totp` z temp tokenem
- Sukces → zapisz JWT, redirect do `/dashboard`
- Błąd → komunikat, wyczyść input
- Timer: "Token wygasa za X:XX" (odliczanie od 5 min)

### Frontend — komponent CodeInput
- [ ] 🟡 Utworzyć `components/CodeInput.tsx`:
- 6 osobnych pól input (po 1 cyfrze)
- Auto-przejście do następnego pola po wpisaniu cyfry
- Backspace → cofnij do poprzedniego
- Paste obsługuje wklejenie 6 cyfr na raz
- Auto-submit po wypełnieniu wszystkich 6

### ✅ Checkpoint Fazy 1B
- [ ] Cały flow działa: Register → Login → Setup 2FA → Logout → Login z 2FA → Dashboard
- [ ] QR code skanuje się poprawnie w Google Authenticator
- [ ] Kody z Google Auth są akceptowane
- [ ] Błędne kody są odrzucane
- [ ] Rate limiting na verify-totp działa

---

## Faza 1C — Rate limiting, audit log, polish

### Backend — rate limiting
- [ ] 🟡 Skonfigurować `express-rate-limit`:
- `/api/auth/login` → maks. 5 req/min per IP
- `/api/auth/verify-totp` → maks. 3 req/min per IP
- `/api/auth/register` → maks. 3 req/min per IP
- [ ] 🟡 Zwracać nagłówki `X-RateLimit-Remaining` i `Retry-After`

### Backend — audit log endpoint
- [ ] 🟡 Utworzyć `GET /api/user/audit-log`:
- Middleware: `verifyJwt` + `requireFullToken`
- Zwraca ostatnie 20 wpisów dla zalogowanego użytkownika
- Format: `{ logs: [{ action, ip_address, created_at, success }] }`

### Backend — middleware audytowy
- [ ] 🟡 Utworzyć `src/middleware/auditLogger.ts`:
- Funkcja `logAuditEvent(userId, action, req, details?)`:
  - Zapisuje: userId, action, IP, user-agent, details (JSON), timestamp

### Frontend — historia logowań
- [ ] 🟡 Dodać sekcję "Historia logowań" na Dashboard:
- Tabela: data, akcja, IP, status (sukces/błąd)
- Wywołanie `GET /api/user/audit-log`

### Frontend — UX polish
- [ ] 🟡 Komunikaty błędów (toast / alert):
- "Nieprawidłowe dane logowania"
- "Konto zablokowane, spróbuj za X minut"
- "Nieprawidłowy kod weryfikacyjny"
- "2FA zostało aktywowane"
- [ ] 🟡 Loading states na przyciskach (spinner podczas fetch)
- [ ] 🟢 Responsywność mobilna (podstawowa)
- [ ] 🟢 Stylowanie (CSS modules / Tailwind / dowolne)

---

## Faza 2 — Testy i dokumentacja

### Testy manualne
- [ ] 🔴 Przejść wszystkie scenariusze z PRD sekcja 8.1 (testy funkcjonalne F-01 do F-12)
- [ ] 🔴 Przejść wszystkie scenariusze z PRD sekcja 8.2 (testy bezpieczeństwa S-01 do S-07)
- [ ] 🔴 Zrobić screenshoty z każdego testu

### Testy automatyczne (opcjonalnie)
- [ ] 🟢 Zainstalować Jest + Supertest w server/
- [ ] 🟢 Test: rejestracja poprawna → 201
- [ ] 🟢 Test: duplikat emaila → 409
- [ ] 🟢 Test: login poprawny → JWT lub tempToken
- [ ] 🟢 Test: login błędny → 401
- [ ] 🟢 Test: dashboard bez tokenu → 401
- [ ] 🟢 Test: verify-totp z poprawnym kodem → JWT

### Dokumentacja
- [ ] 🔴 Napisać `README.md`:
- Opis projektu
- Wymagania (Node.js 18+, npm)
- Instrukcja uruchomienia (`npm install` + `npm run dev` w obu folderach)
- Zmienne środowiskowe (`.env`)
- [ ] 🔴 Napisać raport `docs/raport.md` (3–5 stron):
1. Wstęp — czym jest 2FA, motywacja
2. Architektura — diagram, stos technologiczny
3. Mechanizmy bezpieczeństwa — bcrypt, TOTP, JWT, rate limiting
4. Testowanie — scenariusze, wyniki, screenshoty
5. Wnioski — co chroni, czego nie, rekomendacje
- [ ] 🟡 Przygotować prezentację / demo (plan pokazu na żywo):
1. Rejestracja nowego użytkownika
2. Logowanie bez 2FA
3. Konfiguracja TOTP (skanowanie QR)
4. Wylogowanie
5. Logowanie z 2FA (wpisanie kodu)
6. Dashboard z historią logowań
7. Demonstracja testu bezpieczeństwa (np. brute force → blokada)

---

## Faza 3 — Passkeys / WebAuthn (opcjonalna)

- [ ] 🟢 Zainstalować `@simplewebauthn/server` i `@simplewebauthn/browser`
- [ ] 🟢 Dodać tabelę `passkeys` do bazy danych
- [ ] 🟢 Endpointy: `/api/passkey/register-options`, `/register-verify`
- [ ] 🟢 Endpointy: `/api/passkey/login-options`, `/login-verify`
- [ ] 🟢 Frontend: ekran wyboru metody 2FA (TOTP vs Passkey)
- [ ] 🟢 Frontend: logowanie przez biometrię
- [ ] 🟢 Dodać porównanie TOTP vs Passkeys do raportu
- [ ] 🟢 Test: rejestracja + logowanie passkey na Chrome z Windows Hello / emulator

---

## Notatki robocze

- [ ] Ustalić termin oddania projektu: [DATA]
- [ ] Ustalić sposób komunikacji (Discord / Teams / inne): [NARZĘDZIE]
- [ ] Podzielić się taskami (Osoba A = frontend, Osoba B = backend)
- [ ] Umówić checkpoint po Fazie 1A (czy logowanie działa E2E)
- [ ] Umówić checkpoint po Fazie 1B (czy 2FA działa E2E)
