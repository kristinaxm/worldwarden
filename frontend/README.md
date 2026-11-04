# frontend

Vue 3 + Vite. Start the database and backend using [backend/README.md](../backend/README.md), then run `npm run dev` here and open `http://localhost:5173`, matching `FRONTEND_ORIGIN` in `backend/.env`. Vite proxies `/api` to `http://localhost:3000`, so all requests use relative `/api/...` paths and the backend's HttpOnly session cookie. For deployment, serve `/api` through the same origin as the frontend and configure the backend origin and HTTPS settings accordingly.

## Pages

| Path | Page |
| --- | --- |
| `/` | Start page with the quiz levels. Locked levels show the XP level that unlocks them |
| `/quiz/:difficulty` | A quiz on `beginner`, `medium`, `advanced` or `expert` |
| `/profil` | Profile: avatar, display name, XP, level and medals |
| `/resultat` | Mina resultat: finished quizzes with every answer |
| `/installningar` | Account settings: change email or password, delete the account |
| `/topplistor` | Leaderboards for total XP and each level, with each player's medals |
| `/tillsammans` | Co-play lobby: host a game or join one with a code |
| `/tillsammans/:code` | A co-play game, where everyone answers the same questions together |
| `/om-oss`, `/hjalp`, `/integritetspolicy`, `/anvandarvillkor` | About, help, privacy policy and terms of use |

## Authentication

The homepage, sidebar and mobile menu open the shared login/registration popup. Account creation returns to login with a confirmation message. The popup also has a GitHub button, which is a normal link to `/api/auth/github`. Login restores the current account after reload; logout revokes the session.

GitHub accounts have no password, so the settings page hides the email and password forms for them (`hasPassword` from the backend) and deleting the account is confirmed with the account's email. Their avatar can be the GitHub profile picture.

## Quiz and results

All four quiz levels load questions, submit answers, and fetch latest/best scores through `/api`. Logged-in players' completed quizzes appear in Mina resultat, newest first, including individual answers, skipped questions, time, XP, and best streak. Expert results show both the country and capital. Guests can play beginner but their results are not saved. Existing localStorage summaries are not imported.

`connectedLevels` in `QuizView.vue` selects the submitted answer field for each level; expert also submits `capital`. `useResults` loads all four levels by default; pass an array such as `['expert']` to show a single level. Existing XP requirements still control which quizzes a player can start. Leaving a quiz before it is finished deletes the unfinished attempt.

## Avatars and medals

The avatars are listed in `src/composables/useProfile.js` and shown with `AvatarIcon.vue`, which also shows the GitHub picture. Medal names, requirement texts and images live in `src/medals.js`; the ids must match `backend/src/medals.js`.

## Sharing the app with the class

`vite.config.js` allows hosts on `.trycloudflare.com`, so the app can be shared through a Cloudflare Quick Tunnel. See [GUIDE.md](../GUIDE.md#dela-appen-med-klassen-cloudflare-quick-tunnel).

## Commands

```sh
npm install      # install dependencies
npm run dev      # development server with hot reload
npm run build    # production build
npm run lint     # ESLint
```
