# Mon budget app

Application de gestion de budget avec :
- Express.js
- React.js
- PostgreSQL
- Authentification JWT
- Gestion des entrées / sorties
- Clients / dettes / paiements
- Historique mensuel

## Structure
- backend : API REST
- frontend : interface React
- backend/init.sql : script d'initialisation PostgreSQL

## 1) Base PostgreSQL avec Docker

```bash
docker compose up --build
```

Les services seront disponibles :
- Backend : http://localhost:4000
- Frontend : http://localhost:3000
- PostgreSQL : localhost:5432

## 2) Démarrage local sans Docker

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

## 3) Base PostgreSQL locale

Créer la base PostgreSQL locale ou utiliser Docker. Le script `backend/init.sql` initialise automatiquement les tables.

## 4) Générer le ZIP

Depuis le dossier parent :

```bash
zip -r mon-budget-app.zip mon-budget-app
```
