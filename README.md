# 2026_FULLSTACK_DEROYE_ADRIEN

## Etat actuel — V1 (Phase 6)

- PostgreSQL dans Docker, Prisma, migrations, seed
- Backend Express + Prisma + OpenAPI (Swagger UI sur `/docs/ui`)
- Frontend React + Vite + React Router + theme clair/sombre
- Dockerisation complete : `db`, `backend`, `frontend`
- **Phase 1** — Authentification `username/password`, sessions cookie HTTP-only, profil, `logout` / `logout-all`
- **Phase 2** — Catalogue `Media + Genre`, accueil, page Films, recherche, filtre, pagination curseur, fiche detail
- **Phase 3** — Upload admin (video + affiche, multipart), streaming HTTP Range, suivi de progression
- **Phase 4** — Favoris, watchlist, notes (1..5), historique, reprise de lecture
- **Phase 5** — Suggestions (workflow `pending → accepted/refused → processed`), administration (utilisateurs, medias)
- **Phase 6** — Swagger UI integre, tests backend et frontend, gestion d'erreurs globale, Docker Compose finalise

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
- Docs OpenAPI (liste HTML) disponibles sur `http://localhost:3000/docs`
- **Swagger UI interactif disponible sur `http://localhost:3000/docs/ui`**
- JSON OpenAPI brut disponible sur `http://localhost:3000/docs/openapi.json`
- Routes phase 1 disponibles sous `http://localhost:3000/api/auth` et `http://localhost:3000/api/users`
- Routes phase 2 disponibles sous `http://localhost:3000/api/media`

### Lecture video locale et chemins fichiers

Le frontend ne doit jamais lire directement un chemin Windows du type `C:\\Videos\\film.mp4`.

Le fonctionnement retenu est le suivant:

- la base stocke des chemins relatifs, par exemple `videos/interstellar.mp4` ou `posters/interstellar.svg`
- ces chemins sont resolus par le backend a partir de `DATA_DIRECTORY`
- le navigateur consomme ensuite des routes HTTP protegees:
  - `GET /api/media/:slug/poster`
  - `GET /api/media/:slug/stream`
- la route video supporte `HTTP Range`, ce qui permet la lecture partielle d'un fichier local

En local:

- `DATA_DIRECTORY=./data`
- le backend lit donc les fichiers dans `back/data`

En Docker:

- `DATA_DIRECTORY=/app/data`
- `docker-compose.yml` monte `./2026_FULLSTACK_DEROYE_ADRIEN/back/data` dans le conteneur backend

Si tu veux lire des videos stockees ailleurs sur ton PC plus tard, il faudra changer uniquement le chemin monte dans `docker-compose.yml`, tout en gardant des chemins relatifs en base.

### Frontend

- `cd front`
- `npm run dev`
- Front disponible sur `http://localhost:5173`
- En developpement, Vite proxy automatiquement `/api`, `/health` et `/docs` vers `http://localhost:3000`

## Lancement dockerise

### Prerequis

- Docker Desktop installe et demarrant
- Ports `80`, `3000` et `5433` libres sur la machine

### Premier lancement (installation propre)

```bash
# Depuis la racine du projet
docker compose up -d --build
```

Le compose demarre automatiquement dans le bon ordre : `db` → `backend` (migration Prisma incluse) → `frontend`.

- Frontend : `http://localhost:80`
- API : `http://localhost:3000`
- Swagger UI : `http://localhost:3000/docs/ui`

### Demarrage habituel (sans rebuild)

```bash
docker compose up -d
```

### Arrêt

```bash
docker compose down
```

### Arrêt et suppression des donnees

```bash
docker compose down -v
```

### Rebuild d'un seul service

```bash
docker compose up -d --build backend
docker compose up -d --build frontend
```

### Stack complete (ancienne commande equivalente)

```bash
docker compose up -d --build db backend frontend
```

### Notes

- Le backend applique `prisma migrate deploy` automatiquement au demarrage du conteneur.
- Les fichiers media (videos, affiches) sont persistes dans `back/data` sur la machine hote, montes dans le conteneur backend via un volume.
- La base de donnees est stockee dans le volume Docker `db_data`. Elle survit aux arrets mais est supprimee avec `docker compose down -v`.
- `SESSION_COOKIE_SECURE=false` doit rester tant que la stack tourne en HTTP sans reverse proxy TLS.

## Prisma

### Lancer une migration

- `npx prisma migrate dev --name phase2_catalog`
- `npx prisma generate`

### Peupler le catalogue de demo

- `npm run prisma:seed`

### Structure media locale

- `back/data/posters` contient les affiches locales servies par l'API
- `back/data/videos` est le dossier cible pour les futurs fichiers video

### Visualiser les tables de la DB

- `npx prisma studio` depuis back
- `npx prisma studio --config ./2026_FULLSTACK_DEROYE_ADRIEN/back/prisma.config.ts` depuis la racine du projet


## Verification du socle

### Backend

- `npm run build`
- `npm run typecheck`
- `http://localhost:3000/health`
- `http://localhost:3000/docs`
- `http://localhost:3000/docs/ui` (Swagger UI interactif)

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
- verifier `GET http://localhost:3000/api/media/<slug>/poster`

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
- le frontend utilise maintenant des URLs relatives et proxy l'API en same-origin
- ce proxy evite les problemes de session sur les affiches et preparera mieux la lecture video HTML
- `SESSION_COOKIE_SECURE=false` doit rester en local tant que la stack tourne en HTTP
