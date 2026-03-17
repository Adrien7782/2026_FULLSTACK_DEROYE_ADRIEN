# 2026_FULLSTACK_DEROYE_ADRIEN

## Etat actuel

Le projet couvre maintenant la phase 0, la phase 1 et la phase 2:

- PostgreSQL dans Docker
- Prisma et migrations
- backend Express + Prisma + OpenAPI
- frontend React + Vite + React Router + theme
- communication front/back
- dockerisation de `db`, `backend` et `frontend`
- authentification `username/password`
- sessions persistantes en base avec cookie HTTP-only
- profil utilisateur (`GET /api/users/me`, `PATCH /api/users/me`)
- `logout` et `logout-all`
- catalogue `Media + Genre`
- accueil catalogue, page `Films`, recherche, filtre par genre
- pagination par curseur et fiche detail film

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
- Routes phase 1 disponibles sous `http://localhost:3000/api/auth` et `http://localhost:3000/api/users`
- Routes phase 2 disponibles sous `http://localhost:3000/api/media`

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

- `npx prisma migrate dev --name phase2_catalog`
- `npx prisma generate`

### Peupler le catalogue de demo

- `npm run prisma:seed`

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

## Verification phase 1

- creer un compte sur `http://localhost:5173/register`
- se connecter sur `http://localhost:5173/login`
- verifier le profil sur `http://localhost:5173/profile`
- verifier `GET http://localhost:3000/api/users/me` avec le cookie de session
- verifier `POST http://localhost:3000/api/auth/logout`

## Verification phase 2

- lancer `npm run prisma:seed` dans `back/` pour charger le catalogue de demo
- verifier l'accueil sur `http://localhost:5173/`
- verifier la page films sur `http://localhost:5173/films`
- tester la recherche par titre et le filtre par genre
- ouvrir une fiche film sur `http://localhost:5173/films/<slug>`
- verifier `GET http://localhost:3000/api/media/home`
- verifier `GET http://localhost:3000/api/media?type=film&limit=12`
- verifier `GET http://localhost:3000/api/media/<slug>`

## Bonnes pratiques Git

Pour ce projet, l'historique Git doit suivre les phases du `PLAN_IMPLEMENTATION.md`.

### Routine recommandee

- toujours lancer `git status` avant de commit
- faire les commandes Git depuis la racine du repo
- verifier que `.env`, `node_modules`, `dist` et autres fichiers generes ne partent pas dans le commit
- faire un commit par bloc coherent de travail, pas un commit par fichier
- faire au minimum un commit propre a la fin de chaque phase
- pousser regulierement sur le remote pour garder une sauvegarde exploitable

### Convention simple de commits

- `chore:` pour le socle technique, la config, Docker, Prisma, scripts
- `feat:` pour une fonctionnalite produit
- `fix:` pour une correction de bug
- `docs:` pour README, plan, AGENTS et documentation technique

Exemples:

- `chore: complete phase 0 technical foundation`
- `feat: implement phase 1 authentication and user management`
- `fix: correct session cookie handling in local docker setup`
- `docs: update readme for phase 1 workflows`

### Tags de jalons

Utiliser un tag a la fin de chaque phase stable:

- `phase-0`
- `phase-1`
- `phase-2`

Exemple de sequence:

- `git add -A`
- `git commit -m "feat: implement phase 1 authentication and user management"`
- `git tag phase-1`
- `git push`
- `git push origin phase-1`

Les tags servent a retrouver facilement un jalon, comparer deux etats du projet et revenir sur un point stable.

### Commandes utiles

- `git log --oneline --decorate --graph`
- `git tag`
- `git show phase-1`
- `git diff phase-0 phase-1`

## Notes importantes

- en local, Prisma utilise `localhost:5433` depuis `back/.env`
- dans Docker, le backend utilise `db:5432` via `docker-compose.yml`
- le frontend dockerise continue d'appeler `http://localhost:3000`
- il ne faut pas mettre `http://backend:3000` dans le frontend, car le code s'execute dans le navigateur
- `SESSION_COOKIE_SECURE=false` doit rester en local tant que la stack tourne en HTTP
