## Media local data

Ce dossier contient les assets locaux geres par le backend.

Structure recommandee:
- `videos/` pour les fichiers video uploades
- `posters/` pour les affiches

Important:
- tu peux soit referencer un fichier local sans copie, soit importer une copie geree par l'application
- si tu importes un fichier, le nom d'origine est normalise puis suffixe avec un identifiant court pour eviter les collisions
- les chemins en base peuvent etre relatifs a `DATA_DIRECTORY` ou absolus si le backend y a acces
- si le backend tourne dans Docker, le chemin reference doit etre visible depuis le conteneur via un volume monte

Exemples:
- `videos/blade-runner-2049-a1b2c3d4.mp4`
- `posters/blade-runner-2049-a1b2c3d4.webp`
