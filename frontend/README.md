# frontend

## Authentication

The homepage, sidebar and mobile menu open the shared login/registration popup. Account creation returns to login with a confirmation message. Login restores the current account after reload; logout revokes the session. All account requests use the backend's HttpOnly cookie.

Start the database and backend using [backend/README.md](../backend/README.md), then run `npm run dev` here. Vite proxies `/api` to `http://localhost:3000`; open the frontend at `http://localhost:5173`, matching `FRONTEND_ORIGIN` in `backend/.env`. For deployment, serve `/api` through the same origin as the frontend and configure the backend origin and HTTPS settings accordingly.

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
