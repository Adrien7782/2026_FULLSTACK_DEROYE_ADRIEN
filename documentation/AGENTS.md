# AGENTS.md

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

Regle:

- `cahier_des_charges.md` definit le besoin produit.
- `documentation/PLAN_IMPLEMENTATION.md` definit l'ordre de livraison et le sequencing par phases/sprints.
- En cas de conflit de priorite, suivre `documentation/PLAN_IMPLEMENTATION.md`.

## Etat actuel du workspace

- Le workspace peut contenir seulement de la documentation au depart.
- Aucun dossier `./front` n'etait present au moment de la redaction de ce fichier.
- Si un dossier `front/` apparait plus tard, il doit etre inspecte avant tout travail UI pour respecter le design existant.

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
- Documenter chaque route publique dans Swagger.
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
- Swagger a jour
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


