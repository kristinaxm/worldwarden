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

## Dela appen med klassen (Cloudflare Quick Tunnel)

En Quick Tunnel ger en publik HTTPS-länk till appen som körs på din dator. Den är gratis och kräver inget konto. Allt körs fortfarande hos dig, och alla som spelar sparas i din lokala databas.

### Så hänger det ihop

```
Klasskamratens dator eller mobil
   │  https://ord-ord-ord.trycloudflare.com
   ▼
Cloudflare (internet)
   │  tunneln, som cloudflared på din dator har öppnat
   ▼
Frontend (Vite)  localhost:5173  ── /api/... ──►  Backend (Express)  localhost:3000  ──►  MySQL i Docker
```

Tunneln pekar bara på frontend. Frontend skickar alla `/api`-anrop vidare till backend, så hela appen ligger på samma adress och inloggningscookien fungerar som vanligt.

### Första gången: installera cloudflared

Bara den som kör demon behöver `cloudflared`. De som spelar behöver bara länken.

**Windows, med winget:**

```sh
winget install --id Cloudflare.cloudflared
```

Stäng terminalen och öppna en ny efteråt, så att kommandot `cloudflared` hittas.

**Windows, utan winget:**

1. Ladda ner `cloudflared-windows-amd64.exe` från [github.com/cloudflare/cloudflared/releases/latest](https://github.com/cloudflare/cloudflared/releases/latest).
2. Skapa mappen `%LOCALAPPDATA%\cloudflared`, flytta filen dit och döp om den till `cloudflared.exe`.
3. Starta tunneln med hela sökvägen i PowerShell:

   ```powershell
   & "$env:LOCALAPPDATA\cloudflared\cloudflared.exe" tunnel --url http://localhost:5173
   ```

**Mac:**

```sh
brew install cloudflared
```

Kontrollera installationen med `cloudflared --version` (eller hela sökvägen ovan).

### Inför varje demo

1. Starta databas, backend och frontend som under [Starta](#starta).
2. Starta tunneln i en fjärde terminal:

   ```sh
   cloudflared tunnel --url http://localhost:5173
   ```

3. Efter några sekunder står adressen i en ruta, till exempel `https://ord-ord-ord.trycloudflare.com`. Skriv in den i `backend/.env`:

   ```sh
   FRONTEND_ORIGIN=https://ord-ord-ord.trycloudflare.com
   ```

   Backend startar om av sig själv när `.env` ändras.

4. Öppna länken själv och testa att logga in. Dela den sedan med klassen, gärna som QR-kod.

### När demon är slut

1. `Ctrl+C` i tunnelns terminal. Länken slutar fungera direkt.
2. Sätt tillbaka `FRONTEND_ORIGIN=http://localhost:5173` i `backend/.env`.

### Att tänka på

- Adressen slumpas fram och byts varje gång tunneln startas. Starta den före demon och låt den vara igång.
- Datorn, Docker, backend, frontend och tunneln måste vara igång hela tiden.
- Den som har länken kommer åt appen. Stäng tunneln när den inte behövs.
- Backend godkänner bara anrop från `FRONTEND_ORIGIN`. Så länge tunneladressen står där får `localhost:5173` fel vid inloggning, så använd tunneladressen själv under demon.

### Om någon annan i gruppen kör demon

Demon körs från en dator, och det kan vara vems som helst. Den som kör den behöver:

- `cloudflared` installerat (se ovan)
- senaste `main` med `npm install` och `npm run migrate` körda
- sin egen `backend/.env` med tunneladressen som `FRONTEND_ORIGIN`

Alla konton, resultat, XP och medaljer sparas i databasen på den datorn. Konton som skapats hos någon annan finns inte där, så klassen registrerar sig på nytt hos den som kör demon. Testa länken på den datorn innan demon.

### Felsökning

| Problem | Orsak och lösning |
|---|---|
| Länken laddar inte de första sekunderna | Adressen är ny. Vänta 10–20 sekunder och ladda om. |
| `Blocked request. This host is not allowed` | Frontend startades innan `allowedHosts` fanns i `vite.config.js`. Starta om frontend. |
| Inloggning ger "Något gick fel" eller `403` | `FRONTEND_ORIGIN` i `backend/.env` är inte exakt tunneladressen (`https://`, inget `/` på slutet). |
| `502 Bad Gateway` | Frontend körs inte på port 5173. Starta den med `npm run dev` i `frontend/`. |

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
