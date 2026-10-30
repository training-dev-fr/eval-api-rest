# Évaluation — Construire une API REST pour un mini-réseau social

## Contexte et objectif

Vous devez développer le serveur du mini-réseau social **Entre nous**. Le client React est fourni : votre API doit lui permettre de fonctionner sans modification de son code.

Un visiteur peut lire les publications et leurs commentaires. Après inscription ou connexion, un utilisateur peut publier un message, commenter une publication et se déconnecter.

Le travail porte sur la création d’une API REST avec **Node.js et Express, en JavaScript, sans TypeScript**. L’objectif est de produire une application simple et fonctionnelle.

## Travail demandé

- Implémenter les sept routes décrites ci-dessous.
- Recevoir et renvoyer des données au format JSON.
- Associer chaque publication et chaque commentaire à son auteur.
- Vérifier les données reçues et renvoyer les codes HTTP adaptés.
- Conserver les utilisateurs, publications et commentaires après un redémarrage du serveur. Un fichier JSON suffit ; une base de données est également acceptée.
- Fournir un README expliquant comment lancer et tester votre API.

La modification et la suppression des publications, les likes, les profils, la pagination et le temps réel ne sont pas demandés. Aucune architecture complexe n’est imposée.

## Démarrage et communication avec le client

Le serveur doit écouter sur **http://localhost:3001**. Toutes les routes commencent par `/api`.

Le client se lance avec :

```sh
npm install
npm run dev
```

Ouvrez l’adresse affichée par Vite. Sa configuration transfère déjà les requêtes `/api` vers `http://localhost:3001` ; il n’est donc pas nécessaire de configurer CORS pour ce fonctionnement.

Votre serveur doit être lancé dans un autre terminal. Documentez sa commande de lancement dans votre README.

Les requêtes contenant un corps utilisent l’en-tête :

```http
Content-Type: application/json
```

## Conventions du contrat d’API

- Respectez exactement les noms des propriétés JSON et les chemins des routes.
- Les identifiants sont des chaînes de caractères uniques, générées par le serveur. Les identifiants des exemples sont fictifs.
- Les dates sont générées par le serveur au format ISO 8601, par exemple `2026-10-30T09:30:00.000Z`.
- Les réponses présentent directement les objets ou tableaux décrits : ne les enveloppez pas dans une propriété `data`.
- Les tableaux vides sont représentés par `[]`.
- Les mots de passe et leurs empreintes ne doivent jamais apparaître dans les réponses.
- Des propriétés supplémentaires sont acceptées, mais toutes les propriétés décrites ci-dessous sont attendues.

### Authentification simple

L’inscription et la connexion renvoient un jeton dans la propriété `token`. Le client le conserve puis l’envoie sur les routes protégées :

```http
Authorization: Bearer <token>
```

Vous pouvez générer un jeton aléatoire et conserver en mémoire son association avec un utilisateur. Un JWT n’est pas obligatoire. Les sessions peuvent être perdues au redémarrage du serveur ; les utilisateurs devront alors se reconnecter.

L’auteur d’une publication ou d’un commentaire doit être déterminé à partir du jeton. Le client n’envoie pas d’identifiant d’auteur dans le corps de ces requêtes.

### Réponses d’erreur

Toute erreur doit renvoyer un objet JSON avec une propriété `error` contenant un message compréhensible. Le texte exact est libre.

```json
{
  "error": "Le contenu est obligatoire."
}
```

| Code | Utilisation |
| --- | --- |
| `400 Bad Request` | Données absentes, invalides ou hors limites |
| `401 Unauthorized` | Identifiants incorrects ou jeton absent, invalide ou révoqué |
| `404 Not Found` | Publication ou route inexistante |
| `409 Conflict` | Pseudo déjà utilisé |
| `500 Internal Server Error` | Erreur interne inattendue |

## Routes attendues

| Méthode | Route | Authentification | Succès |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Non | `201` |
| POST | `/api/auth/login` | Non | `200` |
| GET | `/api/auth/me` | Oui | `200` |
| POST | `/api/auth/logout` | Oui | `204` |
| GET | `/api/posts` | Non | `200` |
| POST | `/api/posts` | Oui | `201` |
| POST | `/api/posts/:postId/comments` | Oui | `201` |

### 1. Inscription — `POST /api/auth/register`

Corps de la requête :

```json
{
  "username": "alice",
  "password": "bonjour123"
}
```

Règles :

- `username` est une chaîne de 2 à 30 caractères après suppression des espaces en début et en fin.
- Le pseudo est unique, sans distinction entre majuscules et minuscules : `Alice` et `alice` désignent le même pseudo.
- `password` est une chaîne d’au moins 6 caractères.
- Le mot de passe doit être conservé sous forme hachée, par exemple avec `scrypt` ou `bcrypt`. Aucun autre mécanisme de sécurité avancé n’est demandé.
- L’inscription connecte immédiatement l’utilisateur : elle doit donc renvoyer un jeton.

Réponse `201 Created` :

```json
{
  "token": "jeton-de-session",
  "user": {
    "id": "u1",
    "username": "alice"
  }
}
```

Erreurs : `400` si les données sont invalides ; `409` si le pseudo est déjà utilisé.

### 2. Connexion — `POST /api/auth/login`

Corps de la requête :

```json
{
  "username": "alice",
  "password": "bonjour123"
}
```

Recherchez le pseudo sans tenir compte de la casse et vérifiez le mot de passe.

Réponse `200 OK` :

```json
{
  "token": "nouveau-jeton-de-session",
  "user": {
    "id": "u1",
    "username": "alice"
  }
}
```

Erreur : `401` si le pseudo ou le mot de passe est incorrect ou absent.

### 3. Utilisateur connecté — `GET /api/auth/me`

Authentification obligatoire. Aucun corps de requête.

Réponse `200 OK` :

```json
{
  "id": "u1",
  "username": "alice"
}
```

Attention : cette route renvoie directement l’utilisateur, sans propriété `user` englobante. Le client l’utilise pour restaurer la connexion au rechargement de la page.

Erreur : `401` si le jeton est absent ou invalide.

### 4. Déconnexion — `POST /api/auth/logout`

Authentification obligatoire. Aucun corps de requête.

Invalidez le jeton utilisé pour cette requête. Il ne doit plus permettre d’accéder aux routes protégées.

Réponse : **`204 No Content`, sans corps de réponse**.

Erreur : `401` si le jeton est absent ou invalide.

### 5. Fil des publications — `GET /api/posts`

Route accessible sans connexion. Aucun corps de requête.

Renvoyez toutes les publications, de la plus récente à la plus ancienne. Chaque publication contient son auteur et tous ses commentaires, du plus ancien au plus récent. Chaque commentaire contient également son auteur.

Réponse `200 OK` :

```json
[
  {
    "id": "p1",
    "userId": "u1",
    "content": "Bonjour tout le monde !",
    "createdAt": "2026-10-30T09:30:00.000Z",
    "author": {
      "id": "u1",
      "username": "alice"
    },
    "comments": [
      {
        "id": "c1",
        "postId": "p1",
        "userId": "u2",
        "content": "Bienvenue !",
        "createdAt": "2026-10-30T09:35:00.000Z",
        "author": {
          "id": "u2",
          "username": "bob"
        }
      }
    ]
  }
]
```

Si aucune publication n’existe, renvoyez `[]`. Une publication sans commentaire doit contenir `"comments": []`.

### 6. Création d’une publication — `POST /api/posts`

Authentification obligatoire.

Corps de la requête :

```json
{
  "content": "Bonjour tout le monde !"
}
```

`content` doit être une chaîne contenant entre 1 et 2 000 caractères après suppression des espaces en début et en fin. Une chaîne composée uniquement d’espaces est refusée.

Réponse `201 Created` :

```json
{
  "id": "p1",
  "userId": "u1",
  "content": "Bonjour tout le monde !",
  "createdAt": "2026-10-30T09:30:00.000Z",
  "author": {
    "id": "u1",
    "username": "alice"
  },
  "comments": []
}
```

Renvoyez l’objet complet : le client l’ajoute directement au fil sans refaire de requête de lecture.

Erreurs : `400` si le contenu est invalide ; `401` si l’utilisateur n’est pas authentifié.

### 7. Ajout d’un commentaire — `POST /api/posts/:postId/comments`

Authentification obligatoire. Remplacez `:postId` par l’identifiant de la publication à commenter, par exemple `/api/posts/p1/comments`.

Corps de la requête :

```json
{
  "content": "Bienvenue !"
}
```

`content` doit être une chaîne contenant entre 1 et 500 caractères après suppression des espaces en début et en fin. La publication ciblée doit exister. Un utilisateur peut commenter ses propres publications et celles des autres.

Réponse `201 Created` :

```json
{
  "id": "c1",
  "postId": "p1",
  "userId": "u2",
  "content": "Bienvenue !",
  "createdAt": "2026-10-30T09:35:00.000Z",
  "author": {
    "id": "u2",
    "username": "bob"
  }
}
```

Renvoyez le commentaire complet : le client l’ajoute directement sous la publication.

Erreurs : `400` si le contenu est invalide ; `401` si l’utilisateur n’est pas authentifié ; `404` si la publication n’existe pas.

## Vérifications avant le rendu

Testez l’API directement avec un outil comme Postman, Bruno ou curl, puis avec le client React. Les validations côté serveur restent nécessaires, même lorsque le formulaire React empêche certaines saisies.

1. Sur une application vide, le fil renvoie `[]` et le client s’affiche correctement.
2. Une inscription crée un utilisateur et le connecte immédiatement.
3. Une deuxième inscription avec le même pseudo, même avec une casse différente, est refusée.
4. Un mauvais mot de passe ne permet pas de se connecter.
5. Après connexion, le rechargement de la page conserve l’utilisateur connecté grâce à `/api/auth/me`.
6. Une publication créée apparaît immédiatement avec son auteur et sa date.
7. Un deuxième utilisateur peut se connecter et commenter cette publication ; le commentaire affiche le bon auteur.
8. Après rechargement, publications et commentaires restent visibles et correctement associés.
9. Les contenus vides, composés uniquement d’espaces ou trop longs sont refusés par l’API.
10. Les routes protégées refusent les requêtes sans jeton ou avec un jeton invalide.
11. Commenter une publication inexistante renvoie `404`.
12. Après déconnexion, le jeton utilisé est refusé par `/api/auth/me`.
13. Après redémarrage du serveur et reconnexion, les données sont toujours présentes.

## Livrables

- Le code source de votre serveur, avec son `package.json` et son fichier de verrouillage npm.
- Un README précisant les prérequis, l’installation, la commande de lancement et le mode de stockage.
- Des exemples de requêtes ou une collection de tests permettant de vérifier les principales routes et les cas d’erreur.

Ne rendez pas le dossier `node_modules`. Le client fourni ne doit pas être modifié pour contourner un problème de l’API.

## Barème proposé — sur 20 points

| Critère | Points |
| --- | ---: |
| Inscription et connexion : validation, unicité du pseudo, vérification du mot de passe, réponses attendues | 4 |
| Authentification : protection des routes, utilisateur courant et invalidation du jeton à la déconnexion | 3 |
| Publications : lecture publique, création, auteurs et ordre du fil | 4 |
| Commentaires : création, association au bon post et au bon auteur, intégration au fil | 3 |
| Contrat HTTP/JSON et gestion des erreurs, y compris les cas limites | 2 |
| Persistance des utilisateurs, publications et commentaires | 2 |
| Lisibilité du code, README et exemples de tests | 2 |
| **Total** | **20** |
