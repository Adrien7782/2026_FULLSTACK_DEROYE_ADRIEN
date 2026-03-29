# Concept \& Architecture

Je compte faire une plateforme de streaming privee utilisant comme stack: React (vite) et node.js.

## Fonctionnalites

L'objectif est de faire une plateforme pour visionner mes propres films et series.

Les utilisateurs pourront consulter tous le catalogue de films et de series de la plateforme. Ils pourront les visionner, les noter et les liker (ce qui les ajoute a leurs favoris). Ils peuvent aussi les ajouter a leur watchList.

Il existe deux types d'utilisateurs:
* Utilisateurs Standards - Ils peuvent regarder Films et Series.
* Utilisateurs Administrateurs - Ils peuvent en plus de regarder des films/series, ils peuvent en ajouter sur la plateforme et gerer les utilisateurs.

Il peut y avoir plusieurs utilisateurs en simultane sur la plateforme.
Plusieurs utilisateurs peuvent regarder un meme film en meme temps.


La plateforme contient une page "Films" qui contiendra le catalogue complet des films de la plateforme.
Sur cette page, il est possible de rechercher un film par son titre et en fonction de son genre.

Les utilisateurs peuvent ajouter des films a leur favoris en les likant, les ajouter a leur watchList ainsi que les noter sur 5 etoiles.

Si un autre utilisateur a regarde le film, cela sera note dans ses details.

Si un autre utilisateur a aime le film, cela sera note dans ses details.

La plateforme contient une page "Series" qui contiendra le catalogue complet des series de la plateforme.

Les utilisateurs peuvent ajouter des series a leur favoris en les likant, les ajouter a leur watchList ainsi que les noter sur 5 etoiles.

Si un autre utilisateur a regarde la serie, cela sera note dans ses details.

Si un autre utilisateur a aime la serie, cela sera note dans ses details.

La plateforme contient une page "Favoris" qui contiendra le catalogue des films et series que l'utilisateur a like.

L'utilisateur peut trier ses favoris en fonction du type de media (Film/serie), genre.

La plateforme contient une page "Historique", qui contiendra la liste de tous les films et series recemment visionnes et ceux encore non termines.

La plateforme contient une page "WatchList", qui contiendra la liste de tous les films et series que l'utilisateur y aura depose. Elle correspond aux films/series que l'utilisateur souhaite regarder prochainement.

Il peut decider de retirer des films/series de sa watchList.

La plateforme contient une page "profil utilisateur" qui contiendra toutes les informations de l'utilisateur: adresse mail, nom, prenom, role...

La plateforme contient une page "suggestions" qui varie en fonction du role de l'utilisateur:
* utilisateur Standard - Elle contient la liste de toutes les suggestions deposees par l'utilisateur. Cette page permet aussi a un utilisateur de remplir un formulaire pour proposer l'ajout d'un nouveau film/serie sur la plateforme par un administrateur.
* utilisateur administrateur - Elle contient la liste des suggestions recues des autres utilisateurs. Un administrateur peut aussi deposer des suggestions.

Les suggestions ont pour status de base: "En attente d'acceptation"

Un administrateur doit valider ou non la suggestion:
* Refuser - Le status de la suggestion devient alors "Refuse"
* Accepter - le status de la suggestion devient alors "En attente de Traitement"

Dans un second temps l'administrateur doit traiter la suggestion en ajoutant le media sur la plateforme.

Je veux que la navigation entre les pages soit fluide.


La plateforme contient une page "Accueil", avec les ajouts recents de films ainsi que de series. Elle contient egalement une partie "Recommendation" avec les recommendations les plus recentes de tous les utilisateurs.

Lorsqu'un media (Film ou Serie) est ajoute a la plateforme, il apparaitra sur la page d'accueil.

Un utilisateur peut recommander un film ou une serie.


Pour regarder un media, il faudra avoir un compte et se connecter a l'aide d'un couple username/password.

Il y aura un systeme de notifications pour prevenir les utilisateurs des ajouts des films de leurs suggestions.

Il est possible d'acceder au profil d'un utilisateur en cliquant sur son nom d'utilisateur ou sa photo de profil. Le profil affichera les informations de l'utilisateur, sa watchList et ses Favoris.

Il faudra une documentation de l'API pour permettre a d'autres developpeurs d'utiliser mon API et de faire des applications tierces (mobile, desktop, etc...).

Il faudra un systeme de signalement d'utilisateurs et de medias.
* Les Administrateurs peuvent signaler des utilisateurs et medias.
* Les utilisateurs ne peuvent signaler que des medias.

Il faudra une page de gestion des signalements pour les administrateurs.


Les medias sont stockes en local sur le PC serveur. L'acces se fait via des paths. L'arborescence des medias est tres rangee.

* Medias
  * Films
    * Film
  * Series
    * Serie
      * Saisons
        * Episodes


## Technique

Je veux utiliser la clean architecture pour organiser mon code de maniere modulaire et faciliter la maintenance et l'evolution de l'application. Je vais separer les differentes couches de l'application (controleurs, services, modeles, etc...) pour une meilleure organisation du code.

Utiliser Swagger pour faire la documentation de l'API. Met le à jour à chaque étape. 

### Technologies utilisees

Je vais utiliser tailwindcss et une bibliotheque de composants pour le front.

J'utiliserai un docker contenant ma config postgresql qui sera fourni avec le code du projet.

Le fichier docker-compose.yml contiendra la configuration de mon projet, notamment les services necessaires pour faire tourner mon application (backend, frontend, base de donnees).

Je vais utiliser un ORM (Object-Relational Mapping) nomme Prisma pour faciliter les interactions avec la base de donnees PostgreSQL. Prisma me permettra de definir mon schema de donnees et de generer automatiquement des requetes SQL pour interagir avec la base de donnees.

### Securite

Appliquer un rate limiting avec express-rate-limit.

Ajouter un systeme de logging propre (Winston) -> Environnement `LOGS_FILE`

Validation des entrees dans le front avec node et dans le back avec Zod.

Configuration des cors dans le backend.

Utilisation de Helmet pour securiser les requetes.


### Methodologie

#### Frontend

Pour le frontend, je veux que le code soit organise de maniere modulaire, avec des composants reutilisables pour faciliter la maintenance et l'evolution de l'application. Je vais suivre les bonnes pratiques de developpement frontend, notamment en utilisant des hooks pour gerer l'etat de l'application et en utilisant des bibliotheques.

Il y aura un store pour gerer les donnees de l'application, notamment les donnees de l'utilisateur connecte.

#### Backend

Pour le backend, je veux que le code soit organise de maniere modulaire, avec des routes et des controleurs separes pour faciliter la maintenance et l'evolution de l'application. Je vais suivre les bonnes pratiques de developpement backend, notamment en utilisant des middlewares pour gerer les erreurs et les authentifications.

### Variables d'environnement

fichier `.env`

####

\#### Backend

NODE_ENV=
DATABASE_URL=postgresql://user:password@localhost:5432/mydatabase
PORT=3000
FRONTEND_URL=http://localhost:5173
DATA_DIRECTORY=/path/to/data/directory
JWT_ACCESS_SECRET_KEY=your_secret_key_for_jwt_token_generation

JWT_REFRESH_SECRET=your_secret_key_for_jwt_refresh_token_generation

JWT_ACCESS_EXPIRATION=900        # 15 minutes

JWT_REFRESH_EXPIRATION=604800    # 7 jours
MAX_FILE_SIZE=5000000000 # en octets (15 Go)
ALLOWED_FILE_TYPES=image/jpeg,image/png,video/mp4

LOGS_FILE=/var/log/rs.log




\#### Front end

NODE_ENV=

API_URL=http://localhost:3000/api

MAX_FILE_SIZE=5000000000 # en octets (5 Go)ALLOWED_FILE_TYPES=image/jpeg,image/png,video/mp4

### Donnees

#### Versions du modele

\---- V1
User: id (uuid), username, nom, prenom, email, mot de passe (bcrypt), photo de profil, date d'inscription, likes prives (boolean), role (standard, admin), created_at, updated_at


Session:

  id              UUID (PK)

  user_id         UUID (FK -> User)

  refresh_token   TEXT (hashe)

  user_agent      TEXT                -- navigateur/device

  ip_address      VARCHAR(45)         -- pour audit

  expires_at      TIMESTAMP

  created_at      TIMESTAMP


Film: id (uuid), path, genre, synopsis, Affiche(image), date d'upload, taille (Go)

Serie: id (uuid), path, genre, synopsis, Affiche(image), date d'upload, taille (en Go), Saisons, Episodes

Suggestion:

Notification: id (uuid), user_id (id de l'utilisateur a qui la notification est destinee), type (like, Ajout de media, recommendation, etc...), post_id (id du post concerne par la notification), is_read (boolean), date de creation, actor_id (uuid - personne qui a effectue l'action)

## Design

Je veux un design ergonomique et responsif, avec une interface utilisateur simple et intuitive.

Je veux utiliser des couleurs agreables a regarder telles que (blanc casse, rose clair pale, vert clair pale, etc...)

Je veux qu'il y ait un mode sombre pour les utilisateurs qui preferent une interface sombre.

Je veux que des cards soient utilisees pour afficher les medias, avec une mise en page claire et aeree.

L'interface doit etre moderne (utilisation de flexbox, grid, etc...) et facile a naviguer, avec une barre de navigation laterale a gauche de l'ecran pour acceder aux differentes pages du site (accueil, Films, Series, etc...).

Je veux que les utilisateurs puissent facilement acceder a leur profil et a leurs parametres pour personnaliser leur experience sur le site. Ils pourront cliquer sur leur photo de profil en haut a droite pour acceder a leur profil, a leurs parametres, et pour se deconnecter.


Dans la barre de navigation, je veux une barre de recherche (faire un composant pour ca) qui permet de rechercher un titre de film parmi tous les medias Films et series confondus.



Pour l'ajout d'un film, il faut avoir un bouton avec un icone + (uniquement visible pour les admins), ca ouvre une popup ou il faut remplir un formulaire avec les infos du media: titre, genre, synopsis, des composants FileUpload pour deposer le film et l'image du film. Un bouton "Ajouter" et un bouton "Annuler". Il faut que le FileUpload affiche un pictogramme pour chaque type de fichiers selectionnes, le nom du fichier, sa taille, et un bouton avec un icone croix pour le supprimer. Pendant l'upload, un progress bar circulaire se completera autour de l'icone croix.

Pendant l'ajout d'un film, l'utilisateur peut fermer la popup, le traitement continuera en arriere plan. Il sera visible par une barre de progression affichee dans l'interface.


# Versions

## Toutes les versions

* Documentation de l'API pour permettre a d'autres developpeurs d'utiliser mon API et de faire des applications tierces (mobile, desktop, etc...).
* Mise a jour du fichier docker-compose.yml pour inclure tous les services necessaires au projet pour la version en cours (backend, frontend, base de donnees, etc...).

## V1

* Systeme d'authentification (inscription, connexion, deconnexion, suppression et anonymisation) avec mot de passe
* Gestion de fichiers (upload) pour permettre a l'administrateur de publier des films pour l'instant
* Visionnage du catalogue de film et de series. Pour permettre aux utilisateurs de selectionner un media pour le visionner.
* Profil d'utilisateur avec des informations personnelles et possibilite de modifier les informations de son profil.
* Barre de recherche sur la page des films et des series en haut de la page pour rechercher parmi les medias.
* Pagination par curseur pour la liste des medias

## V2

* Systeme de notifications pour prevenir les utilisateurs des interactions sur les medias (nouveau like, visionnage, etc...).
* Gestion de fichiers (upload) pour permettre a l'administrateur de publier des series
* Systeme de profil pour permettre aux utilisateurs de consulter les profils des autres utilisateurs, de voir leurs wathclist et medias likes.
* Possibilite de rendre public les likes laisses sur les medias d'autres utilisateurs, avec une section dediee dans le profil pour afficher les posts aimes.
* Profil public pour permettre aux utilisateurs de voir les profils des autres utilisateurs, leurs posts, leurs abonnements et leurs abonnes.
* Ajout d'une recherche par utilisateurs

## V3

### Fonctionnalités sociales (Phase 8)

* **Profils publics/privés** : Un utilisateur peut rendre son profil public ou privé. Sur un profil public, les autres utilisateurs peuvent voir ses favoris (si non masqués), sa recommandation courante et ses compteurs d'abonnés/abonnements.
* **Système d'abonnement** : Un utilisateur peut s'abonner à un autre. Si le profil cible est public, l'abonnement est immédiat. Si le profil est privé, une demande de suivi est envoyée (notification de type `follow_request`). Les demandes peuvent être acceptées ou refusées directement depuis la page notifications.
* **Recherche d'utilisateurs** : Une page dédiée `/users` permet de rechercher des utilisateurs par username.
* **Recommandation de médias** : Un utilisateur peut mettre en avant un média via un bouton "⭐ Mettre en avant" sur la fiche du média. Il laisse un commentaire. Chaque utilisateur n'a qu'une seule recommandation active à la fois (la nouvelle remplace l'ancienne). Les recommandations s'affichent sur la page d'accueil dans une section "Recommandés par la communauté".
* **Notifications pour followers** : Lorsqu'un utilisateur met à jour sa recommandation, ses abonnés reçoivent une notification `new_recommendation`.
* **Notification nouveau média** : Les utilisateurs ayant activé l'option "Me notifier lors d'ajout de médias" (accessible depuis les paramètres du profil) reçoivent une notification `new_media` dès qu'un admin ajoute un nouveau média au catalogue.
* **Notification admin sur nouvelle suggestion** : Lorsqu'un utilisateur soumet une suggestion de média, tous les administrateurs reçoivent une notification `new_suggestion` avec un lien direct vers la page d'administration des suggestions.

## FUTUR

Algorithme de recommendation de contenu pour proposer des medias pertinents aux utilisateurs en fonction de leurs medias passes (likes, reponses, abonnements, etc...).
