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
| GET | `/api/auth/github` | None | `302` to GitHub's consent page |
| GET | `/api/auth/github/callback` | None | `302` to the frontend with a session cookie |
| GET | `/api/auth/me` | None | `200` with `{ "user": { "id": 1, "email": "player@example.com", "createdAt": "..." } }` |
| POST | `/api/auth/logout` | `{}` | `204`, revokes the current session and clears its cookie |
| GET | `/api/health` | None | `200` with `{ "status": "ok", "db": "connected" }` |

Signup creates an account without logging in. Email addresses use ASCII, are trimmed and lowercased, and are unique. Provider-specific aliases such as dots and plus tags are preserved. New passwords contain 5–128 Unicode code points, at least one digit (0–9), and at least one punctuation or symbol character, such as `!` or `#`. Whitespace is preserved but does not count as a symbol. Login accepts existing passwords without imposing the new registration rules. Unknown input fields are ignored.

Invalid input returns `400`. Invalid credentials and missing or expired sessions return `401`. Disallowed origins return `403`, duplicate emails `409`, oversized bodies `413`, non-JSON writes `415`, and excessive attempts `429`. Unexpected failures return a generic `500`. Duplicate signup responses reveal whether an email is registered; login failures use the same response for unknown emails and incorrect passwords.

## GitHub login (OAuth2)

Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` and `BACKEND_ORIGIN` in `.env` from an OAuth App on github.com, with the callback URL `BACKEND_ORIGIN` + `/api/auth/github/callback`. One OAuth App serves the whole team, since the callback resolves to each developer's own machine. Without a client id the rest of the API works unconfigured and `/api/auth/github` redirects to `FRONTEND_ORIGIN/?github=saknas`, which the UI shows as a missing-configuration message. The keys are read once at startup, so restart the API after adding them.

`GET /api/auth/github` must be a normal browser navigation, not `fetch`. It stores a random `state` in a short-lived cookie and redirects to GitHub. The callback rejects a missing or mismatched `state`, exchanges the code for a token, and reads the account's id and verified primary email (`read:user user:email`), since the public profile email can be hidden.

GitHub accounts are stored in `users` like every other account, identified by `github_id`. A first GitHub login on an email that already has a password account links the two rows instead of creating a second one, so both ways in reach the same profile, XP and medals. GitHub accounts have an empty `password_hash` and can never be logged into with the password form. The callback ends in `createSession`, the same session as a password login, so every `requireUser` route works unchanged. Account settings follow from the empty password: `POST /api/profile/email` and `POST /api/profile/password` answer `400` for a GitHub account instead of verifying a password, and `DELETE /api/profile` confirms with the account's own email address rather than a password. `GET /api/auth/me` returns `hasPassword`, which the UI uses to hide the password forms. Password accounts are unaffected and still require their password for all three.

Failures redirect to `FRONTEND_ORIGIN/?github=fel` instead of showing an API error. The link is a page navigation, so errors must redirect rather than return JSON, which would otherwise replace the app with a raw error body.

## Countries API

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| GET | `/api/countries` | None | `200` with every country, sorted by name |
| GET | `/api/countries/:id` | None | `200` with one country, `404` if it doesn't exist |

A country looks like `{ "id": 1, "code": "SE", "name": "Sverige", "capital": "Stockholm", "continent": "Europa" }`. The countries are added by migrations.

`POST /api/countries` and `PUT /api/countries/:id` also exist, but they have no authentication yet. Don't use them from the frontend until they are restricted to admins.

## Quiz API

A quiz is played in three requests. `beginner`, `medium`, `advanced`, and `expert` are supported; unknown difficulties return `400 Unknown difficulty`. Existing XP requirements apply when starting and submitting quizzes.

| Level | Question | Answer field in `POST /api/results` | Correct answer |
| --- | --- | --- | --- |
| `beginner` | Flag + 2 country names | `country` | The country's name |
| `medium` | Flag + 4 capitals | `capital` | The country's capital |
| `advanced` | Flag + country text field | `country` | The country's name, ignoring case and surrounding whitespace |
| `expert` | Flag + country and capital text fields | `country`, `capital` | Both answers must match, ignoring case and surrounding whitespace |

Everything that differs between levels is configured in `src/quizLevels.js`. The rest of the quiz code is shared.

| Method | Path | Who | Success |
| --- | --- | --- | --- |
| GET | `/api/results/stats?difficulty=beginner` | Logged in | `200` with the latest result and highscore for the quiz intro |
| GET | `/api/results?difficulty=beginner` | Logged in | `200` with completed quizzes and their answers, newest first |
| POST | `/api/questions` | Everyone | `201` with 10 questions. Logged in users also get a saved attempt |
| POST | `/api/results` | Everyone | `200` with the graded answers. Saved only for logged in users |

Guests can play `beginner` and get their answers graded, but nothing is saved for them and they collect no XP. For logged in users the session cookie decides who the quiz belongs to.

Result history requires a supported difficulty (`beginner`, `medium`, `advanced`, or `expert`). It returns only the current user's completed attempts, or `[]` when none exist. Each result contains `id`, `difficulty`, `score`, `total`, `xpEarned`, `durationSeconds`, `completedAt`, and ordered `answers` with the same answer shape as quiz submission. Guests receive `401`; an unknown difficulty receives `400`.

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

Every quiz has 10 unique countries. The options are shuffled and the wrong ones come from the same continent when possible. A beginner question has 2 country names, a medium question 4 capitals (e.g. `["Oslo", "Stockholm", "Köpenhamn", "Helsingfors"]`). The correct answer is never sent. Flags are loaded from `https://flagcdn.com/w640/${flagCode}.png`.

`attemptId` is `null` for guests. For logged in users the quiz is saved in `quiz_attempts` and `quiz_answers`, and the time starts now.

### Submit the answers

`POST /api/results` with one answer per question. The answer field is `country` for beginner and `capital` for medium. It holds the chosen option, or `null` if the question was skipped:

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

- Medium answers look like `{ "number": 1, "flagCode": "se", "capital": "Stockholm" }`, and `answer` / `correctAnswer` in the response are capitals. Sending the wrong field for the level returns `400`.
- Expert also requires `capital` on every submitted answer (`null` when skipped). Submission and history responses include `capitalAnswer` and `correctCapital` alongside the country answer. Both submitted answers are stored in `quiz_answers`.
- Logged in users are graded against the countries saved when the quiz started, not the flag codes in the request. The time is calculated by the database.
- Each level has its own highscore and stats.
- A highscore has more correct answers, or the same score in less time. The first finished quiz on a level is not a new highscore.
- Guests send `"attemptId": null` and get `saved: false`, `durationSeconds: null`, `newHighscore: false` and `previousBest: null`. They are graded by looking up the flag code.

Logged in users also get `xp` in the response (see [XP and levels](#xp-and-levels)). Guests get `"xp": null`. Every graded answer has `usedHint`.

`newMedals` lists the medals this quiz unlocked, for example `["quiz-beginner-bronze", "quiz-beginner-silver", "quiz-beginner-gold"]` for 10/10 on the first try (see [Medals](#medals)). It is empty when nothing new was unlocked, and always empty for guests.

Errors: `400` for an unknown difficulty, an invalid `attemptId`, an unknown flag code, or anything other than 10 answers numbered 1–10. `403` if the difficulty is locked. `404` if the quiz doesn't exist or belongs to another user, and `409` if it has already been submitted.

### Stats

`GET /api/results/stats?difficulty=beginner` returns the latest finished quiz and the best one. Both are `null` if the user hasn't finished a quiz on that level. Unfinished quizzes are ignored. Guests get `401`.

```json
{
  "last": { "score": 8, "total": 10, "durationSeconds": 74 },
  "best": { "score": 9, "total": 10, "durationSeconds": 90 }
}
```

## XP and levels

XP is only calculated by the server, when a logged in user's quiz is submitted. The rules live in `src/xpLevels.js`.

| Difficulty | XP per correct answer | With hint | Unlocked at |
| --- | --- | --- | --- |
| `beginner` | 50 | 25 | Level 1 (0 XP) |
| `medium` | 100 | 50 | Level 2 (500 XP) |
| `advanced` | 150 | 75 | Level 3 (1300 XP) |
| `expert` | 200 | 100 | Level 4 (3000 XP) |

- 10/10 correct gives +50 bonus XP, also when hints were used.
- XP is saved per quiz in `quiz_attempts.xp`. Total XP is always `SUM(xp)` of finished quizzes, and the level is calculated from it. Nothing else is stored.
- Guests collect no XP and can only play `beginner`. Starting or submitting a locked difficulty returns `403`.
- All four difficulties have XP values, so a new quiz level gets XP as soon as it is added to `src/quizLevels.js`.
- Migration `012` gives XP to quizzes finished before XP existed.

| Method | Path | Who | Success |
| --- | --- | --- | --- |
| GET | `/api/profile/xp` | Logged in | `200` with total XP, level and unlocked difficulties |
| GET | `/api/profile/medals` | Logged in | `200` with the ids of the unlocked medals |
| POST | `/api/questions/hint` | Logged in | `200` with the hint for one question |

`GET /api/profile/xp` (the `xp` object in `POST /api/results` has the same fields, plus `earned` and `leveledUp`):

```json
{
  "totalXp": 650,
  "level": { "level": 2, "name": "Medel", "minXp": 500, "maxXp": 1299, "unlocks": "medium" },
  "nextLevel": { "level": 3, "name": "Avancerad", "minXp": 1300, "maxXp": 2999, "unlocks": "advanced" },
  "unlockedDifficulties": ["beginner", "medium"],
  "levels": [{ "level": 1, "name": "Nybörjare", "minXp": 0, "maxXp": 499, "unlocks": "beginner" }]
}
```

`nextLevel` is `null` on the highest level, and its `maxXp` is `null`. `levels` holds all four levels.

### Hints

`POST /api/questions/hint` with `{ "attemptId": 42, "number": 3 }` returns `{ "number": 3, "hint": "Europa" }` and marks the question in `quiz_answers.used_hint`. A correct answer to that question then gives half XP. The client never sends whether a hint was used, so it can't be cheated.

A level gets hints by adding `hint: (country) => ...` to its entry in `src/quizLevels.js`. The hint must not be sent with the questions, otherwise it can be read without being counted. Errors: `400` if the level has no hints or the input is invalid, `401` for guests, `404` if the quiz doesn't exist or belongs to another user, and `409` if it is already finished.

### Medals

`GET /api/profile/medals` (logged in, `401` for guests) returns the ids of the unlocked medals:

```json
{ "unlocked": ["quiz-beginner-bronze", "quiz-beginner-silver", "quiz-beginner-gold", "quiz-completed-10"] }
```

| Medal | Requirement |
| --- | --- |
| `quiz-<difficulty>-bronze` | At least 6 correct on that difficulty |
| `quiz-<difficulty>-silver` | At least 8 correct |
| `quiz-<difficulty>-gold` | 10/10 correct |
| `quiz-completed-10/20/30/50` | That many finished quizzes with at least half correct (5 of 10) |
| `quiz-worldwarden` | All 12 level medals |
| `quiz-4perfect` | 10/10 at least once on all four difficulties |

- A higher score also unlocks the lower tiers, so 10/10 gives bronze, silver and gold at once.
- Like XP, medals are never stored. They are calculated from the finished quizzes in `quiz_attempts`, so quizzes played before medals existed count too.
- The rules live in `src/medals.js`. The ids must match `frontend/src/medals.js`, which also holds the names, requirement texts and images.
- Only quizzes with at least half correct (5 of 10) count towards the `quiz-completed-*` medals. Quizzes with fewer correct answers are still saved and   award XP, but do not count towards these medals.

## Leaderboards

| Method | Path | Access | Result |
| --- | --- | --- | --- |
| GET | `/api/leaderboard/xp?page=1` | Everyone | `200` with players sorted by total XP |
| GET | `/api/leaderboard/:difficulty?page=1` | Everyone | `200` with each player's best quiz on `beginner`, `medium`, `advanced` or `expert` |
| GET | `/api/leaderboard/players/:id/medals` | Everyone | `200` with `{ "unlocked": [...] }`, the medal ids of a player on the leaderboards |

`page` is optional (default `1`) and each page has 20 players. A difficulty board looks like this, the XP board has `totalXp`, `level` and `quizCount` instead of `score`, `total`, `durationSeconds` and `completedAt`:

```json
{
  "board": "beginner",
  "page": 1,
  "pageSize": 20,
  "totalPlayers": 27,
  "totalPages": 2,
  "entries": [
    { "id": 3, "place": 1, "name": "Adam", "avatar": "panda", "isMe": false, "score": 10, "total": 10, "durationSeconds": 85, "completedAt": "..." }
  ],
  "me": { "id": 8, "place": 14, "name": "Emma", "avatar": null, "isMe": true, "score": 7, "total": 10, "durationSeconds": 60, "completedAt": "...", "page": 1 }
}
```

- Only finished quizzes count, and every player is shown once per board with their best result.
- XP board: most XP first. Difficulty boards: most correct first, then the fastest time.
- Players with the same result share a `place` (1, 2, 2, 4). Same score and time: the one who got it first is shown above.
- `name` is the display name, or `Spelare #<id>` if the player hasn't chosen one. The email is never sent, since guests can see the leaderboards too.
- `me` is the logged-in player's own row and the `page` it is on. It is `null` for guests and for players who haven't played that board.
- Errors: `404` for an unknown board, `400` for an invalid page.
- A player's medals use the `id` from the leaderboard and are calculated like `GET /api/profile/medals`. Only players with a finished quiz (everyone on the leaderboards) can be looked up, others give `404`, so the endpoint can't be used to find out which user ids exist. `400` for an invalid id.

## Storage and sessions

Passwords use Argon2id with a random salt, 19 MiB memory, two iterations and parallelism one. Password hashes never appear in API responses.

Login creates a random 256-bit session token. Only its SHA-256 hash is stored in `sessions`. The raw token is sent in an HttpOnly, SameSite=Lax cookie with a fixed 24-hour lifetime. Sessions survive API restarts. Logging in replaces the supplied browser session; other devices remain signed in. Logout revokes the supplied session immediately. Changing the password logs out every other session of the account and keeps the one that made the change. Deleting a user cascades to their sessions. Expired sessions are rejected on every protected request and deleted at startup and hourly.

Protected routes use the `requireUser` middleware from `src/sessions.js`. It sets `req.user` from the database; account ownership must come from that value rather than a client-supplied user ID. Routes that guests can also use, like the quiz, use `loadUser` instead: it sets `req.user` to the logged in user or `null` and never blocks the request. Add application tables through migrations with foreign keys to `users.id` as needed.

## Browser integration

Set `FRONTEND_ORIGIN` to the exact frontend origin, without a trailing slash. It defaults to `http://localhost:5173`. Browser requests must include `credentials: 'include'`; JSON POST requests must also set the content type. The browser manages the session cookie. GET `/api/auth/me` restores the current account when the UI loads.

Origin checks, JSON-only writes and SameSite cookies protect state-changing browser requests. Command-line clients without an Origin header are supported. Keep the UI and API on the same site; unrelated frontend/API domains require a different cookie and CSRF configuration.

## Runtime settings

Use `NODE_ENV=production` with HTTPS when deploying. Production cookies use `Secure` and the `__Host-session` name. Development uses `session` over local HTTP. The API and migrations connect as the `worldwarden` application user, which only has access to the `worldwarden` database. The Compose database has a random root password nobody needs, and it only listens on `127.0.0.1`, so it can't be reached from the network.

Registration and login share a limit of 20 requests per IP per 15 minutes. Login additionally permits 10 failed attempts per normalized email per 15 minutes. Limits use process memory and reset on restart. This setup targets one API process with direct client connections; shared limiting and explicit proxy trust configuration are needed when scaling or deploying behind a proxy.

Email verification, password reset, password changes and profile editing are not included. Account data currently consists of the email address and creation/update timestamps.

