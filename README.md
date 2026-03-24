# StreamAdy

Plateforme de streaming privee auto-hebergee. Permet d'uploader, organiser et regarder des films depuis un navigateur, en reseau local ou sur un serveur prive.

## Fonctionnalites V1

- Authentification `username/password`, sessions persistantes
- Catalogue films avec recherche, filtres par genre et pagination
- Upload de films et affiches (admin), streaming HTTP Range
- Favoris, watchlist, notes (1-5), historique, reprise de lecture
- Suggestions de films avec workflow de validation admin
- Administration des utilisateurs et des medias
- API documentee avec Swagger UI

---

## Prerequis

| Outil | Version minimale | Utilisation |
|-------|-----------------|-------------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 24+ | Fait tourner toute la stack |
| [Node.js](https://nodejs.org/) | 20+ | Uniquement pour le developpement local |
| [Git](https://git-scm.com/) | — | Cloner le projet |

> **Pour une installation simple**, seul Docker Desktop est necessaire.

---

## Installation et lancement (Docker — recommande)

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd 2026_FULLSTACK_DEROYE_ADRIEN
```

### 2. Lancer la stack

```bash
docker compose up -d --build
```

Docker demarre automatiquement dans le bon ordre :
- La base de donnees PostgreSQL
- Le backend (applique les migrations Prisma automatiquement au demarrage)
- Le frontend Nginx

### 3. Acceder a l'application

| Service | URL |
|---------|-----|
| Application | http://localhost |
| API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/docs/ui |

### 4. Creer un compte

Ouvre http://localhost/register et cree ton premier compte.

Pour avoir un compte administrateur, il faut modifier le role du premier utilisateur directement en base. Voir la section [Ajouter un administrateur](#ajouter-un-administrateur).

---

## Lancement en mode developpement (sans Docker)

Utile pour modifier le code et voir les changements en temps reel.

### Prerequis supplementaires

- Node.js 20+
- Une instance PostgreSQL accessible (ou `docker compose up -d db` pour demarrer uniquement la base)

### 1. Configurer les variables d'environnement

```bash
cp back/.env.example back/.env
cp front/.env.example front/.env
```

Editer `back/.env` et ajuster `DATABASE_URL` selon ton installation PostgreSQL.

### 2. Installer les dependances

```bash
cd back && npm install
cd ../front && npm install
```

### 3. Appliquer les migrations et generer le client Prisma

```bash
cd back
npx prisma migrate dev
npx prisma generate
```

### 4. Lancer le backend

```bash
cd back
npm run dev
# API disponible sur http://localhost:3000
```

### 5. Lancer le frontend

```bash
cd front
npm run dev
# Application disponible sur http://localhost:5173
```

En mode dev, Vite proxifie automatiquement `/api`, `/health` et `/docs` vers `http://localhost:3000`.

---

## Ajouter un administrateur

Depuis le repertoire `back/`, ouvrir Prisma Studio :

```bash
npx prisma studio
```

Ou, si la base tourne dans Docker :

```bash
DATABASE_URL="postgresql://streamady:streamady_password@localhost:5434/streamady?schema=public" npx prisma studio
```

Dans la table `User`, modifier le champ `role` de `standard` a `admin` pour l'utilisateur souhaite.

---

## Structure des medias

Les fichiers video et les affiches sont stockes localement dans `back/data/` :

```
back/data/
  posters/    → affiches des films
  videos/     → fichiers video
```

En Docker, ce dossier est monte comme volume dans le conteneur backend. Les fichiers survivent aux arrets et rebuilds.

> Si tu veux stocker les videos dans un autre dossier sur ta machine, modifie le volume dans `docker-compose.yml` :
> ```yaml
> volumes:
>   - /chemin/vers/tes/videos:/app/data
> ```

---

## Commandes utiles

### Docker

```bash
# Demarrer la stack
docker compose up -d

# Arreter la stack (donnees conservees)
docker compose down

# Arreter et supprimer toutes les donnees
docker compose down -v

# Rebuild d'un seul service apres modification du code
docker compose up -d --build backend
docker compose up -d --build frontend

# Voir les logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Backend (depuis `back/`)

```bash
npm run dev          # Lancer en mode developpement
npm run build        # Compiler TypeScript
npm run typecheck    # Verifier les types
npm test             # Lancer les tests
npm run prisma:seed  # Peupler la base avec des donnees de demo
npx prisma studio    # Interface graphique pour la base de donnees
npx prisma migrate dev --name <nom>  # Creer une migration
```

### Frontend (depuis `front/`)

```bash
npm run dev          # Lancer en mode developpement
npm run build        # Compiler pour la production
npm run typecheck    # Verifier les types
npm run lint         # Verifier le code
npm test             # Lancer les tests
```

---

## Variables d'environnement

Les fichiers `.env.example` contiennent toutes les variables avec leurs valeurs par defaut.

| Fichier | Description |
|---------|-------------|
| `back/.env.example` | Variables du backend (base de donnees, sessions, upload, logs) |
| `front/.env.example` | Variables du frontend (URL API, limites upload) |

Les variables injectees par Docker Compose en production sont definies directement dans `docker-compose.yml`.

---

## Ports utilises

| Port | Service |
|------|---------|
| `80` | Frontend (Docker) |
| `3000` | Backend API |
| `5433` | PostgreSQL (dev local) |
| `5434` | PostgreSQL (Docker, acces externe) |

---

## Notes techniques

- Le cookie de session est HTTP-only. `SESSION_COOKIE_SECURE=false` doit rester en HTTP sans TLS.
- Le streaming video utilise HTTP Range — compatible avec tous les navigateurs modernes.
- En Docker, le backend se connecte a la base via `db:5432` (reseau interne Docker). Le port `5434` est uniquement pour les outils externes (Prisma Studio, DBeaver, etc.).
- Les migrations Prisma sont appliquees automatiquement au demarrage du conteneur backend via `prisma migrate deploy`.
