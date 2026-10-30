# Entre nous

Mini réseau social en **JavaScript**, avec React (Vite) et une API Node.js / Express.

## Lancer en développement

Prérequis : Node.js 22.12+ ou 24+ et npm.

```sh
npm install
npm run server
```

Dans un deuxième terminal :

```sh
npm run dev
```

Ouvrir l’adresse affichée par Vite (par défaut http://localhost:5173).

## Fonctionnalités

- Inscription avec un pseudo et un mot de passe, connexion et déconnexion.
- Lecture du fil public, du plus récent au plus ancien.
- Publication de posts et ajout de commentaires après connexion.
- Conservation des données dans `server/data/db.json`, créé automatiquement.

Les mots de passe sont hachés avec `scrypt`. Les sessions sont conservées en mémoire : après un redémarrage du serveur, il faut se reconnecter. Ce POC utilise un fichier JSON et reste prévu pour un seul processus serveur.

## Build et lancement

```sh
npm run build
npm start
```

L’API et le front sont alors accessibles sur http://localhost:3001. La variable `PORT` permet de changer le port du serveur.

## API

| Méthode | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Inscription (`username`, `password`) |
| POST | `/api/auth/login` | Connexion (`username`, `password`) |
| GET | `/api/auth/me` | Utilisateur connecté |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/posts` | Posts et leurs commentaires |
| POST | `/api/posts` | Publier (`content`) |
| POST | `/api/posts/:postId/comments` | Commenter (`content`) |

Les routes de connexion et d’inscription renvoient un `token` à envoyer dans l’en-tête `Authorization: Bearer <token>` pour les routes authentifiées.
