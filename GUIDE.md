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

cp .env.example .env
cp backend/.env.example backend/.env

cd backend
npm install

cd ../frontend
npm install
```

### Databaslösenord

Databasen använder användaren `worldwarden` (inte `root`) och bara den egna datorn kan ansluta till den. Hitta på ett lösenord, till exempel med:

```sh
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

Skriv in samma lösenord som `DB_PASSWORD` i **både** `.env` (i projektmappen) och `backend/.env`. Båda filerna ignoreras av git, så lösenordet hamnar aldrig på GitHub.

Har du en databas sedan tidigare (med `root`/`root`) måste den skapas om en gång, eftersom MySQL bara skapar användaren när databasen är ny:

```sh
docker compose down -v
docker compose up -d
cd backend
npm run migrate
```

## Starta

Tre terminaler, från projektmappen:

| Del | Kommando | Adress |
|---|---|---|
| Databas | `docker compose up -d` | localhost:3306 |
| Backend | `cd backend` → `npm run dev` | http://localhost:3000 |
| Frontend | `cd frontend` → `npm run dev` | http://localhost:5173 |

När databasen har startat, kör `npm run migrate` i `backend/` innan backend startas första gången och efter att nya migrationer har lagts till. Se [backend/README.md](backend/README.md) för autentisering och API.

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
| User | `worldwarden` |
| Password | Ditt `DB_PASSWORD` från `.env` |
| Database | `worldwarden` |

## Stoppa databasen

```sh
docker compose down       # datan sparas
docker compose down -v    # raderar all data
```
