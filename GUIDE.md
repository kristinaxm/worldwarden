# Guide

Repo: https://github.com/kristinaxm/worldwarden

## Krav

- Node 24 LTS (`.nvmrc`)
- Docker Desktop (måste vara igång)
- Git

## Första gången

```sh
git clone git@github.com:kristinaxm/worldwarden.git
cd worldwarden

cd backend
cp .env.example .env
npm install

cd ../frontend
npm install
```

## Starta

Tre terminaler, från projektmappen:

| Del | Kommando | Adress |
|---|---|---|
| Databas | `docker compose up -d` | localhost:3306 |
| Backend | `cd backend` → `npm run dev` | http://localhost:3000 |
| Frontend | `cd frontend` → `npm run dev` | http://localhost:5173 |

## Testa

- Backend + databas: `GET http://localhost:3000/api/health` ska ge `{"status":"ok","db":"connected"}`
- Frontend: öppna http://localhost:5173
- Databas: `docker compose ps` ska visa `worldwarden-db-1` som `Up`

Får du `{"status":"error","db":"unreachable"}` kör inte databasen. Starta Docker Desktop och kör `docker compose up -d`.

## Databasanslutning (IntelliJ)

Database → `+` → Data Source → MySQL

| Fält | Värde |
|---|---|
| Host | `localhost` |
| Port | `3306` |
| User | `root` |
| Password | `root` |
| Database | `worldwarden` |

## Stoppa databasen

```sh
docker compose down       # datan sparas
docker compose down -v    # raderar all data
```
