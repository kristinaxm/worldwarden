# worldwarden

- `frontend/` – Vue 3 + Vite
- `backend/` – Node + Express 5 + MySQL (mysql2)
- `docker-compose.yml` – MySQL för lokal utveckling

## Kom igång

Krav: Node 24 (`nvm use` / `fnm use` läser `.nvmrc`) och Docker.

```sh
# 1. Databas
docker compose up -d

# 2. Backend (http://localhost:3000)
cd backend
cp .env.example .env
npm install
npm run dev

# 3. Frontend (http://localhost:5173), i en ny terminal
cd frontend
npm install
npm run dev
```

Testa att backend når databasen: `GET http://localhost:3000/api/health`
