# Méthode de projet — Co-développement avec IA (Claude Code)

## Contexte

StreamAdy est un projet fullstack développé en co-développement entre un développeur humain et Claude Code (Anthropic). Ce document décrit la méthode de travail mise en place, les outils utilisés, les conventions adoptées et les enseignements tirés de cette collaboration.

---

## Principes fondateurs

### L'IA comme pair développeur, pas comme outil de génération de code

Claude Code n'a pas été utilisé pour générer du code en masse à coller dans un projet existant. Il a été impliqué dans toutes les décisions du projet : architecture, séquencement des phases, choix techniques, corrections et arbitrages. La relation est celle d'un binôme, où chaque partie apporte sa valeur.

### Sources de vérité explicites

Avant toute intervention, Claude Code lit dans cet ordre :

1. `cahier_des_charges.md` — le besoin produit
2. `documentation/PLAN_IMPLEMENTATION.md` — le séquencement et la roadmap
3. `CORRECTIONS.md` — les remarques et bugs en cours

Ce mécanisme évite les dérives hors-périmètre et garantit la cohérence entre les intentions du développeur et les actions de l'IA.

### Itérations courtes et vérifiables

Chaque session de travail suit le même schéma :
- Lecture de l'état actuel (fichiers, git status, logs)
- Annonce du plan court si la tâche est structurante
- Implémentation incrémentale
- Vérification (typecheck, tests, build Docker)
- Mise à jour de la documentation

---

## Organisation du projet

### Structure documentaire

```
documentation/
  PLAN_IMPLEMENTATION.md   → roadmap par phases et sprints
  methodes.md              → ce document
cahier_des_charges.md      → spécifications produit
CORRECTIONS.md             → backlog de corrections en continu
CLAUDE.md                  → instructions permanentes pour Claude Code
README.md                  → guide d'installation et d'exploitation
```

### CLAUDE.md — la mémoire permanente de l'IA

Le fichier `CLAUDE.md` est la pièce centrale de la méthode. Il contient :

- La description du projet et de la stack technique
- L'état actuel du workspace (phases terminées, branchées)
- Les règles de cadrage (pas d'OAuth, pas de cloud storage, auth username/password)
- Les conventions backend et frontend
- La priorité de développement
- La définition of done minimale

Ce fichier est mis à jour automatiquement à la fin de chaque phase. Il permet à chaque nouvelle session de reprendre exactement là où la précédente s'est arrêtée, sans perte de contexte.

### CORRECTIONS.md — le backlog vivant

`CORRECTIONS.md` fonctionne comme un mini-backlog en temps réel. Le développeur y consigne :
- Les remarques UX/UI observées à l'usage
- Les bugs constatés
- Les questions en suspens

À chaque session, la commande `Applique les corrections du fichier CORRECTIONS.md` suffit pour déclencher un cycle de correction complet. Une fois les corrections appliquées, le fichier est vidé pour accueillir les prochaines observations.

---

## Roadmap par phases

Le projet est découpé en phases numérotées, chacune contenant des sprints :

| Phase | Contenu |
|-------|---------|
| 0 | Socle technique, Docker, Prisma, Swagger |
| 1 | Authentification et gestion utilisateur |
| 2 | Catalogue médias et consultation |
| 3 | Upload de films et streaming |
| 4 | Interactions utilisateur (favoris, watchlist, notes, historique) |
| 5 | Suggestions et administration |
| 6 | Stabilisation et release V1 |
| 7+ | V2 séries, notifications, profils publics |

La règle est simple : on ne passe à la phase suivante que lorsque la précédente est branchée de bout en bout, testée et documentée.

---

## Conventions de développement

### Définition of done

Une fonctionnalité n'est pas terminée si :
- elle n'est pas branchée de bout en bout (frontend + backend)
- les permissions ne sont pas vérifiées
- la validation des entrées est absente
- la documentation Swagger n'est pas mise à jour
- les variables d'environnement nécessaires ne sont pas documentées

### Stack et choix techniques figés

Certains choix sont explicitement figés pour éviter la dérive :
- Authentification `username/password` uniquement (pas d'OAuth)
- Stockage local des médias (pas de cloud, pas de CDN)
- PostgreSQL + Prisma (pas d'ORM alternatif)
- HTTP Range pour le streaming (pas de transcodage)

Ces règles sont écrites dans `CLAUDE.md` et s'imposent à toutes les sessions.

### Conventions de commits

```
chore:  socle technique, config, Docker, Prisma, scripts
feat:   fonctionnalité produit
fix:    correction de bug
docs:   README, plan, documentation technique
```

Un commit propre est créé à la fin de chaque phase, accompagné d'un tag Git de jalon (`phase-1`, `phase-2`, etc.).

---

## Workflow type d'une session

```
1. Ouvrir le projet dans VS Code avec Claude Code actif
2. Donner le contexte : "Lis CLAUDE.md et continues mon projet"
   → Claude Code lit CLAUDE.md, PLAN_IMPLEMENTATION.md, CORRECTIONS.md
3. Demande de fonctionnalité ou correction :
   - "Passe à la phase X"
   - "Applique les corrections du fichier CORRECTIONS.md"
   - "Corrige l'erreur [log]"
4. Claude Code annonce son plan, implémente, vérifie
5. Le développeur teste dans le navigateur / Docker
6. Nouvelles observations → CORRECTIONS.md
7. Fin de phase → mise à jour CLAUDE.md + commit + tag
```

---

## Gestion des corrections continues

Le cycle de correction fonctionne ainsi :

```
Observation en usage
       ↓
Ajout dans CORRECTIONS.md (remarque / bug / question)
       ↓
"Applique les corrections du fichier CORRECTIONS.md"
       ↓
Claude Code lit, analyse, implémente, vérifie
       ↓
CORRECTIONS.md vidé, prêt pour la prochaine session
```

Ce cycle peut être déclenché plusieurs fois par session. Il est volontairement séparé du développement des nouvelles fonctionnalités pour garder une distinction claire entre "corriger ce qui existe" et "construire ce qui n'existe pas encore".

---

## Gestion du contexte long terme

Claude Code ne conserve pas de mémoire native entre les sessions. Plusieurs mécanismes compensent cela :

| Mécanisme | Rôle |
|-----------|------|
| `CLAUDE.md` | Contexte permanent : stack, état, règles |
| `PLAN_IMPLEMENTATION.md` | Roadmap et séquencement |
| `CORRECTIONS.md` | Backlog de session en session |
| Git history | Trace des décisions techniques |
| README | Documentation d'exploitation à jour |

La règle : tout ce qui doit survivre à une session doit être écrit quelque part dans ces fichiers.

---

## Enseignements de la méthode

### Ce qui fonctionne bien

- **Les sources de vérité explicites** — `CLAUDE.md` + `CORRECTIONS.md` sont le duo le plus efficace. Ils permettent de reprendre n'importe quelle session sans briefing oral.
- **Le découpage en phases** — évite de tout vouloir faire d'un coup. Chaque phase livrée est utilisable.
- **La commande "Applique les corrections"** — simple, directe, sans ambiguïté. Claude Code lit, priorise et implémente.
- **La vérification systématique** — typecheck + build Docker à chaque fin de session garantit qu'on ne laisse pas de dette technique silencieuse.

### Les points de vigilance

- **Les migrations partielles** — introduire Tailwind CSS dans un projet déjà stylé avec des variables CSS custom sans finir la migration crée des incohérences. Toujours terminer ce qu'on commence.
- **Les versions de dépendances** — Tailwind v4, Vite v8, Prisma 7 ont chacun des breaking changes par rapport aux tutoriels courants. Vérifier la compatibilité avant d'intégrer.
- **Le proxy Vite** — les limites de taille du proxy Vite (via `follow-redirects`) nécessitent un traitement spécifique pour les uploads de fichiers volumineux.
- **Les versions de base de données** — PostgreSQL 18 (ancien container) vs 16 (nouveau container) rend les dumps incompatibles. Toujours harmoniser les versions entre les environnements.

---

## Résumé

> Cette méthode repose sur trois piliers : des **sources de vérité documentées** accessibles à l'IA à chaque session, un **découpage en phases vérifiables** qui empêche la dérive, et un **cycle de corrections continu** qui transforme les observations d'usage en améliorations concrètes. Claude Code y joue le rôle d'un développeur disponible en permanence, capable de lire le contexte, d'implémenter, de tester et de documenter — à condition que le développeur humain maintienne les fichiers de pilotage à jour.
