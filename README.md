# 2026_FULLSTACK_DEROYE_ADRIEN

## Phase 0

Le socle technique couvre maintenant:

- PostgreSQL dans Docker
- Prisma et migrations
- backend Express + Prisma + OpenAPI skeleton
- frontend React + Vite + React Router + theme
- communication front/back
- dockerisation de `db`, `backend` et `frontend`

## Variables d'environnement

Des fichiers d'exemple sont fournis:

- `back/.env.example`
- `front/.env.example`

## Lancement local

### Base de donnees

- `docker compose up -d db`
- `docker compose ps`

### Backend

- `cd back`
- `npm run dev`
- API disponible sur `http://localhost:3000`
- Docs OpenAPI disponibles sur `http://localhost:3000/docs`

### Frontend

- `cd front`
- `npm run dev`
- Front disponible sur `http://localhost:5173`

## Lancement dockerise

### Backend

- `docker compose up -d --build backend`
- le conteneur applique `prisma migrate deploy` avant de demarrer le serveur

### Frontend

- `docker compose up -d --build frontend`

### Stack complete

- `docker compose up -d --build db backend frontend`

## Prisma

### Lancer une migration

- `npx prisma migrate dev --name init`
- `npx prisma generate`

### Visualiser les tables de la DB

- `npx prisma studio` depuis back
- `npx prisma studio --config ./2026_FULLSTACK_DEROYE_ADRIEN/back/prisma.config.ts` depuis la racine du projet


## Verification du socle

### Backend

- `npm run build`
- `npm run typecheck`
- `http://localhost:3000/health`
- `http://localhost:3000/docs`

### Frontend

- `npm run typecheck`
- `npm run lint`
- `http://localhost:5173`

## Notes importantes

- en local, Prisma utilise `localhost:5433` depuis `back/.env`
- dans Docker, le backend utilise `db:5432` via `docker-compose.yml`
- le frontend dockerise continue d'appeler `http://localhost:3000`
- il ne faut pas mettre `http://backend:3000` dans le frontend, car le code s'execute dans le navigateur
