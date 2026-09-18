# Vertex AI Coach

Plateforme de coaching sportif intégrant des recommandations générées par IA : coach de gym (programme, nutrition, suppléments), suivi de course à pied (journal, plans d'entraînement adaptatifs) et compteur de pas.

## Structure du repo (monorepo)

```
AI-Running-Coach/
├── api/         # API Flask — auth, journal d'entraînement, plans IA
├── web/         # Application React + TypeScript
├── render.yaml  # Blueprint de déploiement de l'API sur Render
└── netlify.toml # Configuration de build/déploiement du frontend sur Netlify
```

## Stack

- **API** : Python (Flask), JWT (`flask-jwt-extended`), BCrypt, MongoDB (`pymongo`), API Groq (tier gratuit) pour les plans adaptatifs
- **Web** : React + TypeScript (Vite), Tailwind CSS (responsive + dark mode), React Router, Recharts
- **Base de données** : MongoDB Atlas
- **Déploiement** : Render (api/) + Netlify (web/), CI/CD via push GitHub

## Démarrage local

### API

```bash
cd api
python -m venv .venv
.venv/Scripts/activate  # Windows
cp .env.example .env    # puis renseigner MONGODB_URI, JWT_SECRET_KEY, GROQ_API_KEY
pip install -r requirements.txt
python run.py
```

### Web

```bash
cd web
cp .env.example .env  # VITE_API_URL
npm install
npm run dev
```

### Créer un compte admin

Aucun utilisateur n'est admin par défaut. Après avoir créé un compte via l'interface, promeus-le :

```bash
cd api
python scripts/make_admin.py ton-email@exemple.com
```

## Statut

- Auth (inscription/connexion/JWT/rôles) : fait
- Journal d'entraînement (CRUD) : fait
- Plan d'entraînement généré par IA (Groq) : fait
- Dashboard (statistiques, graphiques) : fait
- Administration (liste + gestion des rôles) : fait
- Déploiement (Render/Netlify) : à venir
