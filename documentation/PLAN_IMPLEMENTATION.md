# Plan d'implementation

## Hypotheses de travail

- Le plan est base sur `cahier_des_charges.md`.
- La roadmap fonctionnelle du cahier des charges sert de reference pour les versions V1, V2 et V3.
- Hypothese de cadence: 1 sprint = 1 semaine.
- Le dossier `./front` n'etait pas present dans le workspace au moment de la redaction de ce plan. Les sprints frontend sont donc definis a partir du cahier des charges et devront etre ajustes des que le design source sera disponible.
- Le projet est traite comme un produit auto-heberge avec stockage local des medias.

## Ordre de priorite recommande

1. Construire un socle technique stable.
2. Livrer une V1 exploitable autour de l'authentification, du catalogue, du streaming et de l'upload de films.
3. Ajouter les suggestions et l'administration avancee.
4. Ouvrir la V2 avec les series, les notifications et les profils publics.

## Vue d'ensemble des phases

- Phase 0 - Cadrage technique et socle du projet
- Phase 1 - Authentification et gestion utilisateur
- Phase 2 - Catalogue medias et consultation
- Phase 3 - Upload de films et streaming
- Phase 4 - Interactions utilisateur et profil
- Phase 5 - Suggestions et administration
- Phase 6 - Stabilisation et release V1
- Phase 7 - V2 series et notifications
- Phase 8 - V2 profils publics et recherche utilisateurs

## Phase 0 - Cadrage technique et socle du projet

### Objectif

Poser une base de travail propre pour eviter les reworks structurels lors des phases metier.

### Sprint 0.1 - Initialisation du projet

Objectifs:

- Initialiser la structure du repository avec au minimum `front/`, `back/`, `documentation/`.
- Creer le `docker-compose.yml` avec PostgreSQL, backend et frontend.
- Definir les fichiers `.env.example` frontend et backend.
- Mettre en place le lint, le formatage et les conventions de nommage.
- Ecrire un README de bootstrap local.

Sorties attendues:

- Le projet demarre localement avec Docker Compose.
- Le backend expose une route `GET /health`.
- Le frontend affiche une page de shell vide ou une page temporaire.

### Sprint 0.2 - Architecture applicative

Objectifs:

- Mettre en place l'architecture backend par modules (`auth`, `users`, `media`, `suggestions`, `admin`).
- Installer Prisma et definir un schema initial vide mais coherent.
- Mettre en place React Router et le layout principal frontend.
- Poser le systeme de theme clair/sombre.
- Initialiser Swagger avec un squelette d'API.

Sorties attendues:

- Arborescence stable front/back.
- Documentation Swagger accessible.
- Base de donnees connectee depuis le backend.

## Phase 1 - Authentification et gestion utilisateur

### Objectif

Rendre l'application privee et permettre l'acces par `username/password`.

### Sprint 1.1 - Domaine utilisateur et sessions

Objectifs backend:

- Implementer les tables `User` et `Session`.
- Gerer le hash du mot de passe avec bcrypt.
- Definir les roles `standard` et `admin`.
- Mettre en place la rotation de refresh token et la gestion de session par appareil.

Objectifs frontend:

- Creer les pages `Connexion` et `Inscription`.
- Mettre en place le store de session utilisateur.
- Ajouter les guards de routes.

Sorties attendues:

- Un utilisateur peut s'inscrire, se connecter et recuperer sa session.
- Les pages protegees sont inaccessibles sans authentification.

### Sprint 1.2 - Profil et securisation des acces

Objectifs backend:

- Implementer `GET /me`, `PATCH /me`, `POST /logout`, `POST /logout-all`.
- Ajouter les middlewares d'authentification et d'autorisation.
- Configurer CORS, Helmet, rate limit et logging.

Objectifs frontend:

- Creer la page `Profil utilisateur`.
- Permettre la mise a jour des informations personnelles.
- Ajouter le menu utilisateur pour profil, parametres et deconnexion.

Sorties attendues:

- Gestion complete du profil connecte.
- Securite minimale en place sur les routes privees.

## Phase 2 - Catalogue medias et consultation

### Objectif

Rendre le catalogue consultable avec recherche, filtres et pagination.

### Sprint 2.1 - Modele media et APIs catalogue

Objectifs backend:

- Implementer les tables `Film` ou `Media` selon la modelisation retenue.
- Ajouter `Genre` et les relations necessaires.
- Exposer les routes de listing, recherche par titre, filtre par genre et detail media.
- Mettre en place la pagination par curseur.

Objectifs frontend:

- Creer la page `Accueil`.
- Creer la page `Films`.
- Construire les composants `MediaCard`, `SearchBar`, filtres et pagination.

Sorties attendues:

- Le catalogue film est consultable.
- La page d'accueil affiche les ajouts recents.

### Sprint 2.2 - Fiches medias et navigation

Objectifs backend:

- Finaliser les DTO de detail media.
- Ajouter les statistiques simples necessaires a l'affichage.

Objectifs frontend:

- Creer la page detail d'un film.
- Brancher la navigation entre accueil, catalogue et detail.
- Integrer le design existant des cards, de la sidebar et de la recherche des que `./front` sera disponible.

Sorties attendues:

- Navigation fluide entre les principales pages.
- Fiche film complete cote UI.

## Phase 3 - Upload de films et streaming

### Objectif

Permettre aux administrateurs d'ajouter des films et aux utilisateurs de les regarder.

### Sprint 3.1 - Upload admin

Objectifs backend:

- Implementer le service d'upload local avec dossier temporaire.
- Gerer la validation des types MIME et de la taille maximale.
- Enregistrer les chemins des fichiers en base.
- Mettre en place un suivi d'upload exploitable par le frontend.

Objectifs frontend:

- Creer la popup d'ajout de film.
- Implementer les composants `FileUpload` pour video et image.
- Afficher la progression circulaire sur chaque fichier.
- Garder visible une progression globale meme apres fermeture de la popup.

Sorties attendues:

- Un administrateur peut envoyer une video + une affiche.
- Le film est stocke en local et reference en base.

### Sprint 3.2 - Streaming

Objectifs backend:

- Exposer une route de lecture video avec support HTTP Range.
- Verifier les autorisations d'acces avant streaming.
- Gerer les statuts de media (`draft`, `published`, etc.) si necessaire.

Objectifs frontend:

- Integrer le lecteur video HTML5.
- Ajouter la page de lecture ou la zone de lecture sur la fiche film.
- Afficher les erreurs de lecture de facon propre.

Sorties attendues:

- Un utilisateur connecte peut lire un film publie.
- Plusieurs utilisateurs peuvent lire un meme film en meme temps.

## Phase 4 - Interactions utilisateur et profil

### Objectif

Rendre la plateforme utile au quotidien avec favoris, watchlist, notes et historique.

### Sprint 4.1 - Favoris, watchlist et notes

Objectifs backend:

- Implementer les tables et endpoints `Favorite`, `WatchlistItem`, `Rating`.
- Ajouter les contraintes d'unicite et la validation 1..5 pour les notes.

Objectifs frontend:

- Ajouter les actions favori / watchlist / note sur la fiche film.
- Creer les pages `Favoris` et `WatchList`.
- Ajouter les filtres de base sur la page favoris.

Sorties attendues:

- Les interactions sont persistantes et refletees dans l'interface.

### Sprint 4.2 - Historique et reprise de lecture

Objectifs backend:

- Implementer `PlaybackProgress`.
- Sauvegarder la position de lecture.
- Distinguer `en cours` et `termine`.

Objectifs frontend:

- Creer la page `Historique`.
- Afficher les medias recemment vus et ceux encore non termines.
- Reprendre automatiquement le film a la derniere position connue.

Sorties attendues:

- La progression de lecture est fiable.
- L'historique utilisateur est exploitable.

## Phase 5 - Suggestions et administration

### Objectif

Ajouter le workflow de suggestions et la base de l'administration fonctionnelle.

### Sprint 5.1 - Suggestions

Objectifs backend:

- Implementer la table `Suggestion`.
- Creer le workflow `pending -> accepted/refused -> processed`.
- Lier une suggestion traitee au media cree si necessaire.

Objectifs frontend:

- Creer la page `Suggestions` utilisateur standard.
- Ajouter le formulaire de suggestion.
- Creer la vue administrateur des suggestions recues.

Sorties attendues:

- Le cycle de vie des suggestions est fonctionnel.

### Sprint 5.2 - Administration utilisateurs et medias

Objectifs backend:

- Ajouter les endpoints admin pour lister les utilisateurs.
- Permettre la modification de role.
- Ajouter la gestion des medias cote admin.

Objectifs frontend:

- Creer la page `Admin > Utilisateurs`.
- Creer la page `Admin > Films`.
- Ajouter les actions admin avec controles de permission.

Sorties attendues:

- Un administrateur peut gerer les utilisateurs et les films depuis l'interface.

## Phase 6 - Stabilisation et release V1

### Objectif

Fiabiliser la V1 et preparer une premiere release utilisable.

### Sprint 6.1 - Qualite, securite, documentation

Objectifs:

- Completer la documentation Swagger.
- Ajouter les tests prioritaires backend.
- Ajouter les tests critiques frontend.
- Durcir la validation des donnees et les logs.
- Finaliser la gestion d'erreurs globale.

Sorties attendues:

- API documentee.
- Couverture minimale sur les flux critiques.

### Sprint 6.2 - Recette et packaging

Objectifs:

- Faire une recette fonctionnelle complete de la V1.
- Corriger les bugs bloquants.
- Verifier Docker Compose en installation propre.
- Ecrire la documentation d'exploitation locale.

Sorties attendues:

- Version V1 candidate a la mise en service.

## Phase 7 - V2 series et notifications

### Objectif

Etendre la plateforme au vrai multi-type media et aux notifications.

### Sprint 7.1 - Modele series

Objectifs:

- Ajouter les modeles `Serie`, `Saison`, `Episode`.
- Adapter le stockage local a l'arborescence des series.
- Definir les routes d'upload et de lecture des episodes.

### Sprint 7.2 - UI series

Objectifs:

- Creer les pages `Series`, detail serie, detail saison si necessaire.
- Ajouter la navigation entre films et series.
- Adapter la recherche multi-type.

### Sprint 7.3 - Notifications

Objectifs:

- Implementer `Notification`.
- Ajouter la generation de notifications sur les evenements retenus.
- Afficher un centre de notifications dans l'interface.

## Phase 8 - V3 Social, Abonnements & Recommandations

### Objectif

Ajouter une dimension sociale complète : profils publics/privés, système d'abonnement entre utilisateurs,
recommandations de médias affichées sur la page d'accueil, et notifications associées.

### Sprint 8.1 - Schéma Prisma + Backend

Objectifs backend:

- Ajouter `isPublic` et `notifyOnNewMedia` sur `User`.
- Ajouter `relatedId` sur `Notification`.
- Ajouter 4 nouvelles valeurs à `NotificationType`: `follow_request`, `follow_accepted`, `new_media`, `new_recommendation`.
- Créer l'enum `FollowStatus` (`pending`, `accepted`) et le modèle `Follow`.
- Créer le modèle `MediaRecommendation` (unique par userId).
- Créer le module `social` avec service + routes (follow, recommendations).
- Enrichir `GET /users/by/:username` (followerCount, followingCount, followStatus, currentRecommendation, favorites).
- Ajouter `GET /users/search?q=`.
- Accepter `isPublic` et `notifyOnNewMedia` dans `PATCH /users/me`.
- Envoyer notification `new_media` après chaque création de média par un admin.

Sorties attendues:

- Un utilisateur peut suivre / se désabonner d'un autre.
- Les demandes de suivi (profil privé) génèrent une notification acceptabe/refusable.
- Un utilisateur peut mettre en avant un média avec un commentaire.
- Les followers reçoivent une notification `new_recommendation` à chaque mise en avant.
- Les utilisateurs opt-in reçoivent `new_media` à chaque ajout de média.

### Sprint 8.2 - Frontend

Objectifs frontend:

- Ajouter types et fonctions dans `api.ts` (FollowStatus, RecommendationItem, PublicUserProfile).
- HomePage : section "Recommandés par la communauté" avec RecommendationCard.
- UserProfilePage : enrichi (follow button, compteurs, recommandation courante, favoris).
- Nouvelle page UsersSearchPage à `/users` avec champ de recherche.
- ProfilePage : ajout checkboxes `isPublic` et `notifyOnNewMedia`.
- NotificationsPage : nouveaux types avec icônes + boutons Accepter/Refuser pour `follow_request`.
- FilmDetailPage + SerieDetailPage : bouton "⭐ Mettre en avant" ouvrant RecommendationPopup.
- AppLayout : lien "Utilisateurs" dans la nav.

Sorties attendues:

- Flux follow end-to-end (public et privé avec demande).
- Recommandations visibles sur la homepage pour tous les utilisateurs.
- Popup de recommandation avec avertissement si remplacement d'une recommandation existante.


## Travaux transverses a maintenir tout au long du projet

- Mettre a jour Swagger a chaque ajout de route.
- Mettre a jour `docker-compose.yml` quand un service change.
- Garder le schema Prisma, les migrations et les `.env.example` synchronises.
- Ajouter des jeux de donnees de demo pour accelerer les recettes.
- Documenter les arbitrages techniques dans `documentation/`.

## Jalons de validation

- Jalon A: fin de Phase 1 -> application privee avec auth fonctionnelle.
- Jalon B: fin de Phase 3 -> films uploadables et lisibles.
- Jalon C: fin de Phase 5 -> V1 fonctionnelle presque complete.
- Jalon D: fin de Phase 6 -> release V1.
- Jalon E: fin de Phase 8 -> release V2.
- Jalon F: fin de Phase 9 -> release V3.
