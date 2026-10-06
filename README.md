# worldwarden

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

Backendens autentisering och API beskrivs i [backend/README.md](backend/README.md).
