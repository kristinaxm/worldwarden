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

### GitHub-inloggning (valfritt)

Inloggning med GitHub behöver en OAuth App på github.com. Har någon i gruppen redan skapat en: hoppa till punkt 4 och be om nycklarna.

1. github.com → Settings → Developer settings → OAuth Apps → New OAuth App
2. Homepage URL: `http://localhost:5173`
3. Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
4. Skriv in `GITHUB_CLIENT_ID` och `GITHUB_CLIENT_SECRET` i `backend/.env`

Hela gruppen kan dela på **en** OAuth App. Callback-adressen pekar på `localhost`, alltså varje persons egen dator, så samma app fungerar för alla samtidigt. Be den som skapade appen om `GITHUB_CLIENT_ID` och `GITHUB_CLIENT_SECRET` och klistra in dem i din egen `backend/.env`. Skicka dem aldrig via git eller en publik kanal.

Hoppar du över det här fungerar allt annat som vanligt — bara GitHub-knappen slutar funka, och den säger till att nycklarna saknas.

### Felsökning: GitHub-knappen säger att nycklarna saknas

Nycklarna läses **en gång när backend startar**. Har du precis lagt in dem måste du starta om backend, annars kör den vidare på de gamla tomma värdena.

Räcker inte Ctrl+C? Då kan en gammal backend ligga kvar och hålla port 3000, till exempel från en terminal du stängt. Den syns inte i din nuvarande terminal, så Ctrl+C där stoppar fel process. Hitta och stoppa den på PID:

```powershell
netstat -ano | findstr ":3000" | findstr LISTENING
taskkill /F /PID <PID-numret från första kommandot>
```

Starta sedan `npm run dev` igen. Den nya processen ska skriva `API lyssnar på http://localhost:3000`. Står det `EADDRINUSE` lever den gamla kvar ännu. Se till att bara ha **en** backend-terminal igång.

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
