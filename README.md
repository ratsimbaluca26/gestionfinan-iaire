# Mon budget app

Application de gestion de budget avec :
- Express.js
- React.js
- MySQL
- Authentification JWT
- Gestion des entrées / sorties
- Clients / dettes / paiements
- Historique mensuel

## Structure
- backend : API REST
- frontend : interface React
- backend/sql/schema.sql : base de données MySQL

## 1) Base MySQL
Créer la base :
mysql -u root -p < backend/sql/schema.sql

## 2) Backend
cd backend
cp .env.example .env
# remplir les valeurs
npm install
npm run dev

## 3) Frontend
cd frontend
cp .env.example .env
npm install
npm start

## 4) Générer le ZIP
Depuis le dossier parent :
zip -r mon-budget-app.zip mon-budget-app
