# Backend

Express API with MySQL account storage and cookie-based authentication. Users, sessions and future application tables share the database configured by `DB_NAME` in `.env`.

## Local setup

Start Docker Desktop. In the repository root, copy `.env.example` to `.env` and set `DB_PASSWORD`, then run `docker compose up -d`. In `backend/`:

```sh
cp .env.example .env   # use the same DB_USER and DB_PASSWORD as the root .env
npm ci
npm run migrate
npm run dev
```

Copy `.env.example` only on first setup. The default API address is `http://localhost:3000`. Database connection settings must match the existing Compose database. Compose does not automatically read `backend/.env`.

`npm run migrate` applies unapplied SQL files in filename order and records them in `schema_migrations`. It can be run again safely. Migrations are additive; do not edit an applied migration. The runner supports simple semicolon-separated SQL statements, not stored routines or statements with embedded semicolons. MySQL schema changes are not transactional.

## Authentication API

All POST requests require `Content-Type: application/json`. Errors have the shape `{ "error": "message" }`.

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | `{ "email": "player@example.com", "password": "a long example passphrase 1!" }` | `201` with `{ "user": { "id": 1, "email": "player@example.com" } }` |
| POST | `/api/auth/login` | Email and password | `200` with the user and a session cookie |
| GET | `/api/auth/me` | None | `200` with `{ "user": { "id": 1, "email": "player@example.com", "createdAt": "..." } }` |
| POST | `/api/auth/logout` | `{}` | `204`, revokes the current session and clears its cookie |
| GET | `/api/health` | None | `200` with `{ "status": "ok", "db": "connected" }` |

Signup creates an account without logging in. Email addresses use ASCII, are trimmed and lowercased, and are unique. Provider-specific aliases such as dots and plus tags are preserved. New passwords contain 5–128 Unicode code points, at least one digit (0–9), and at least one punctuation or symbol character, such as `!` or `#`. Whitespace is preserved but does not count as a symbol. Login accepts existing passwords without imposing the new registration rules. Unknown input fields are ignored.

Invalid input returns `400`. Invalid credentials and missing or expired sessions return `401`. Disallowed origins return `403`, duplicate emails `409`, oversized bodies `413`, non-JSON writes `415`, and excessive attempts `429`. Unexpected failures return a generic `500`. Duplicate signup responses reveal whether an email is registered; login failures use the same response for unknown emails and incorrect passwords.

## Countries API

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| GET | `/api/countries` | None | `200` with every country, sorted by name |
| GET | `/api/countries/:id` | None | `200` with one country, `404` if it doesn't exist |

A country looks like `{ "id": 1, "code": "SE", "name": "Sverige", "capital": "Stockholm", "continent": "Europa" }`. The countries are added by migrations.

`POST /api/countries` and `PUT /api/countries/:id` also exist, but they have no authentication yet. Don't use them from the frontend until they are restricted to admins.

## Quiz API

A quiz is played in three requests. Only `beginner` is supported so far; other difficulties return `400 Unknown difficulty`.

| Method | Path | Who | Success |
| --- | --- | --- | --- |
| GET | `/api/results/stats?difficulty=beginner` | Logged in | `200` with the latest result and highscore for the quiz intro |
| POST | `/api/questions` | Everyone | `201` with 10 questions. Logged in users also get a saved attempt |
| POST | `/api/results` | Everyone | `200` with the graded answers. Saved only for logged in users |

Guests can play and get their answers graded, but nothing is saved for them. For logged in users the session cookie decides who the quiz belongs to.

### Start a quiz

`POST /api/questions` with `{ "difficulty": "beginner" }`:

```json
{
  "attemptId": 42,
  "difficulty": "beginner",
  "questions": [
    { "number": 1, "flagCode": "se", "options": ["Norge", "Sverige"] }
  ]
}
```

Every quiz has 10 unique countries. Each beginner question has two shuffled options: the correct country and a wrong one from the same continent. The correct answer is never sent. Flags are loaded from `https://flagcdn.com/w640/${flagCode}.png`.

`attemptId` is `null` for guests. For logged in users the quiz is saved in `quiz_attempts` and `quiz_answers`, and the time starts now.

### Submit the answers

`POST /api/results` with one answer per question. `country` is the chosen option, or `null` if the question was skipped:

```json
{
  "attemptId": 42,
  "difficulty": "beginner",
  "answers": [
    { "number": 1, "flagCode": "se", "country": "Sverige" },
    { "number": 2, "flagCode": "jp", "country": null }
  ]
}
```

Response:

```json
{
  "saved": true,
  "score": 8,
  "total": 10,
  "durationSeconds": 74,
  "newHighscore": true,
  "previousBest": { "score": 7, "total": 10, "durationSeconds": 90 },
  "answers": [
    { "number": 1, "flagCode": "se", "answer": "Sverige", "correct": true, "correctAnswer": "Sverige" }
  ]
}
```

- Logged in users are graded against the countries saved when the quiz started, not the flag codes in the request. The time is calculated by the database.
- A highscore has more correct answers, or the same score in less time. The first finished quiz on a level is not a new highscore.
- Guests send `"attemptId": null` and get `saved: false`, `durationSeconds: null`, `newHighscore: false` and `previousBest: null`. They are graded by looking up the flag code.

Errors: `400` for an unknown difficulty, an invalid `attemptId`, an unknown flag code, or anything other than 10 answers numbered 1–10. `404` if the quiz doesn't exist or belongs to another user, and `409` if it has already been submitted.

### Stats

`GET /api/results/stats?difficulty=beginner` returns the latest finished quiz and the best one. Both are `null` if the user hasn't finished a quiz on that level. Unfinished quizzes are ignored. Guests get `401`.

```json
{
  "last": { "score": 8, "total": 10, "durationSeconds": 74 },
  "best": { "score": 9, "total": 10, "durationSeconds": 90 }
}
```

## Storage and sessions

Passwords use Argon2id with a random salt, 19 MiB memory, two iterations and parallelism one. Password hashes never appear in API responses.

Login creates a random 256-bit session token. Only its SHA-256 hash is stored in `sessions`. The raw token is sent in an HttpOnly, SameSite=Lax cookie with a fixed 24-hour lifetime. Sessions survive API restarts. Logging in replaces the supplied browser session; other devices remain signed in. Logout revokes the supplied session immediately. Deleting a user cascades to their sessions. Expired sessions are rejected on every protected request and deleted at startup and hourly.

Protected routes use the `requireUser` middleware from `src/sessions.js`. It sets `req.user` from the database; account ownership must come from that value rather than a client-supplied user ID. Routes that guests can also use, like the quiz, use `loadUser` instead: it sets `req.user` to the logged in user or `null` and never blocks the request. Add application tables through migrations with foreign keys to `users.id` as needed.

## Browser integration

Set `FRONTEND_ORIGIN` to the exact frontend origin, without a trailing slash. It defaults to `http://localhost:5173`. Browser requests must include `credentials: 'include'`; JSON POST requests must also set the content type. The browser manages the session cookie. GET `/api/auth/me` restores the current account when the UI loads.

Origin checks, JSON-only writes and SameSite cookies protect state-changing browser requests. Command-line clients without an Origin header are supported. Keep the UI and API on the same site; unrelated frontend/API domains require a different cookie and CSRF configuration.

## Runtime settings

Use `NODE_ENV=production` with HTTPS when deploying. Production cookies use `Secure` and the `__Host-session` name. Development uses `session` over local HTTP. The API and migrations connect as the `worldwarden` application user, which only has access to the `worldwarden` database. The Compose database has a random root password nobody needs, and it only listens on `127.0.0.1`, so it can't be reached from the network.

Registration and login share a limit of 20 requests per IP per 15 minutes. Login additionally permits 10 failed attempts per normalized email per 15 minutes. Limits use process memory and reset on restart. This setup targets one API process with direct client connections; shared limiting and explicit proxy trust configuration are needed when scaling or deploying behind a proxy.

Email verification, password reset, password changes and profile editing are not included. Account data currently consists of the email address and creation/update timestamps.

