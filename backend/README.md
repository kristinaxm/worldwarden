# Backend

Express API with MySQL account storage and cookie-based authentication. Users, sessions and future application tables share the database configured by `DB_NAME` in `.env`.

## Local setup

Start Docker Desktop, then run `docker compose up -d` from the repository root. In `backend/`:

```sh
cp .env.example .env
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

## Storage and sessions

Passwords use Argon2id with a random salt, 19 MiB memory, two iterations and parallelism one. Password hashes never appear in API responses.

Login creates a random 256-bit session token. Only its SHA-256 hash is stored in `sessions`. The raw token is sent in an HttpOnly, SameSite=Lax cookie with a fixed 24-hour lifetime. Sessions survive API restarts. Logging in replaces the supplied browser session; other devices remain signed in. Logout revokes the supplied session immediately. Deleting a user cascades to their sessions. Expired sessions are rejected on every protected request and deleted at startup and hourly.

Future protected routes can use the `requireUser` middleware from `src/sessions.js`. It sets `req.user` from the database; account ownership must come from that value rather than a client-supplied user ID. Add application tables through migrations with foreign keys to `users.id` as needed.

## Browser integration

Set `FRONTEND_ORIGIN` to the exact frontend origin, without a trailing slash. It defaults to `http://localhost:5173`. Browser requests must include `credentials: 'include'`; JSON POST requests must also set the content type. The browser manages the session cookie. GET `/api/auth/me` restores the current account when the UI loads.

Origin checks, JSON-only writes and SameSite cookies protect state-changing browser requests. Command-line clients without an Origin header are supported. Keep the UI and API on the same site; unrelated frontend/API domains require a different cookie and CSRF configuration.

## Runtime settings

Use `NODE_ENV=production` with HTTPS when deploying. Production cookies use `Secure` and the `__Host-session` name. Development uses `session` over local HTTP. Replace the default local root database credentials with a restricted application user for deployment.

Registration and login share a limit of 20 requests per IP per 15 minutes. Login additionally permits 10 failed attempts per normalized email per 15 minutes. Limits use process memory and reset on restart. This setup targets one API process with direct client connections; shared limiting and explicit proxy trust configuration are needed when scaling or deploying behind a proxy.

Email verification, password reset, password changes and profile editing are not included. Account data currently consists of the email address and creation/update timestamps.

