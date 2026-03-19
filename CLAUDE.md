# CLAUDE.md

## Objet du projet

StreamAdy est une plateforme de streaming privee auto-hebergee.

Stack ciblee:

- Frontend: React + Vite
- Backend: Node.js + Express
- Base de donnees: PostgreSQL + Prisma
- Documentation API: Swagger
- Infra locale: Docker Compose

Les medias sont stockes localement sur le serveur via des chemins de fichiers.

## Sources de verite

Avant toute modification, lire dans cet ordre:

1. `cahier_des_charges.md`
2. `documentation/PLAN_IMPLEMENTATION.md`
3. `CORRECTIONS.md`

Regle:

- `cahier_des_charges.md` definit le besoin produit.
- `documentation/PLAN_IMPLEMENTATION.md` definit l'ordre de livraison et le sequencing par phases/sprints.
- `CORRECTIONS.md` regroupe les remarques, ajustements et defauts a corriger au fil du developpement.
- En cas de conflit de priorite, suivre `documentation/PLAN_IMPLEMENTATION.md`.

## Etat actuel du workspace

- Le workspace peut contenir seulement de la documentation au depart.
- Le repository contient maintenant `front/`, `back/` et `documentation/`.
- Le frontend possede un shell React Router avec theme, layout principal, store de session, guards et pages catalogue.
- Le backend expose `/health`, `/docs`, une phase 1 fonctionnelle pour `auth` et `users`, et une phase 2 fonctionnelle pour `media`.
- La phase 1 est deja branchee de bout en bout: inscription, connexion, session cookie, `GET /me`, `PATCH /me`, `logout`, `logout-all`.
- La phase 2 est deja branchee de bout en bout: `Media + Genre`, home catalogue, listing films, filtre par genre, pagination par curseur, fiche detail media.
- Les affiches catalogue sont maintenant stockees localement dans `back/data/posters` et servies via `GET /api/media/:slug/poster`.
- La phase 3 est deja branchee de bout en bout:
  - Sprint 3.1 Upload: `POST /api/admin/media` (admin only, multipart/form-data) avec multer, validation MIME/taille, stockage local video+poster, enregistrement en base, suivi de progression XHR cote frontend, popup admin, indicateur flottant global persistant.
  - Sprint 3.2 Streaming: `GET /api/media/:slug/stream` avec HTTP Range, auth via middleware global, lecteur HTML5 integre dans la fiche detail.

## Regles de cadrage

- L'authentification doit rester `username/password` uniquement tant qu'une consigne contraire n'est pas donnee.
- Ne pas introduire OAuth ou des providers externes sans demande explicite.
- Conserver le stockage local des medias comme hypothese par defaut.
- Ne pas introduire de cloud storage, CDN ou transcodage complexe sans validation utilisateur.
- Respecter la roadmap V1 -> V2 -> V3 au lieu d'implementer toutes les fonctionnalites d'un coup.

## Priorite de developpement

Toujours avancer dans cet ordre:

1. Socle technique
2. Authentification et utilisateurs
3. Catalogue et consultation
4. Upload et streaming
5. Interactions utilisateur
6. Suggestions et administration
7. Stabilisation V1
8. V2 puis V3

## Conventions backend

- Organiser le backend par modules metier: `auth`, `users`, `media`, `suggestions`, `admin`, `notifications`, `reports`.
- Utiliser Prisma pour la persistence.
- Utiliser Zod pour la validation des DTO.
- Documenter chaque route publique dans l'OpenAPI skeleton accessible via `/docs`.
- Proteger les routes privees avec des middlewares d'authentification et d'autorisation.
- Verifier strictement les permissions admin sur les actions sensibles.
- Pour le streaming, supporter HTTP Range.

## Conventions frontend

- Respecter le design existant si `front/` est disponible.
- Sinon, construire une interface sobre et modulaire en attendant l'integration du vrai design.
- Centraliser l'etat de session utilisateur dans un store dedie.
- Centraliser aussi l'etat des uploads pour permettre la fermeture de la popup sans perdre le suivi visuel.
- Preferer des composants reutilisables pour les cartes medias, recherche, upload et navigation.

## Conventions donnees

- Les chemins fichiers en base doivent etre relatifs a `DATA_DIRECTORY`.
- Les fichiers reels lives dans `back/data` en local et dans `/app/data` en Docker par defaut.
- Pour la video, privilegier `GET /api/media/:slug/stream` avec support HTTP Range plutot qu'une exposition directe du filesystem.
- Toute nouvelle variable d'environnement doit etre documentee.
- Les migrations Prisma doivent rester coherentes avec le cahier des charges et le plan.
- Eviter les modeles trop abstraits si le besoin produit n'est pas encore stabilise.

## Facon de travailler pour un agent IA

- Commencer par inspecter l'etat du workspace avant de proposer une solution.
- Si la tache est importante, annoncer un plan court puis executer.
- Faire des changements incrementaux et verifiables.
- Ne pas inventer des fonctionnalites absentes du cahier des charges.
- Si une ambiguite bloque, la signaler clairement avec une proposition concrete.
- Mettre a jour la documentation quand une decision de structure, de schema ou d'API change.

## Livrables attendus pendant le developpement

- Code source
- Migrations Prisma
- OpenAPI / docs API a jour
- `.env.example` a jour
- Documentation technique si une decision structurante est prise
- Tests minimum sur les flux critiques

## Definition of done minimale

Une fonctionnalite n'est pas consideree terminee si:

- elle n'est pas branchee de bout en bout
- les permissions ne sont pas verifiees
- la validation des entrees est absente
- la documentation d'API n'est pas mise a jour
- les variables d'environnement necessaires ne sont pas documentees

# Avancement
Mets à jour automatiquement l'avancement à la fin du développement

## Dernière phase terminée
Phase 4

## Prochaine phase
Phase 5
