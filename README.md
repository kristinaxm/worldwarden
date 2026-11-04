# worldwarden

WorldWarden är ett geografiquiz: lär dig världen, ett quiz i taget. Man testar sig på flaggor, kontinenter, länder och huvudstäder i fyra svårighetsnivåer, samlar XP och medaljer, tävlar på topplistor och kan spela samma quiz tillsammans med klassen.

- `frontend/` – Vue 3 + Vite
- `backend/` – Node + Express 5 + MySQL (mysql2)
- `docker-compose.yml` – MySQL för lokal utveckling

## Kom igång

Krav: Node 24 (`nvm use` / `fnm use` läser `.nvmrc`) och Docker.

```sh
# 1. Miljöfiler – hitta på ett databaslösenord och skriv in det
#    som DB_PASSWORD i BÅDA filerna
cp .env.example .env
cp backend/.env.example backend/.env

# 2. Databas
docker compose up -d

# 3. Backend (http://localhost:3000)
cd backend
npm install
npm run migrate
npm run dev

# 4. Frontend (http://localhost:5173), i en ny terminal
cd frontend
npm install
npm run dev
```

Testa att backend når databasen: `GET http://localhost:3000/api/health`

Backendens autentisering och API beskrivs i [backend/README.md](backend/README.md). Steg för steg, GitHub-inloggning och felsökning finns i [GUIDE.md](GUIDE.md).

## Dela appen med klassen

Appen kan delas via en publik länk med Cloudflare Quick Tunnel, medan allt körs på din dator:

```sh
# Med databas, backend och frontend igång, i en ny terminal
cloudflared tunnel --url http://localhost:5173
```

Skriv in adressen som visas som `FRONTEND_ORIGIN` och `BACKEND_ORIGIN` i `backend/.env` och dela länken. För GitHub-inloggning via länken läggs adressen också till som Redirect URI i GitHub-appen. Installation, felsökning och vad du ska göra efter demon finns i [GUIDE.md](GUIDE.md#dela-appen-med-klassen-cloudflare-quick-tunnel).
