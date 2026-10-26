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
- backend/schema.sql : schéma PostgreSQL

## 1) Démarrage rapide avec Docker

```bash
docker compose up --build
```

Services disponibles :
- Backend : http://localhost:4000
- Frontend : http://localhost:3000
- PostgreSQL : localhost:5432

## 2) Backend local

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## 3) Frontend local

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

## 4) Base PostgreSQL locale

```bash
createdb mon_budget
psql -d mon_budget -f backend/schema.sql
```

## 5) Générer le ZIP

Depuis le dossier parent :

```bash
zip -r mon-budget-app.zip mon-budget-app
```
