# AI-Running-Coach

Application de suivi d'entraînement sportif intégrant des recommandations générées par IA (plans d'entraînement adaptatifs).

## Structure du repo (monorepo)

```
AI-Running-Coach/
├── api/         # API Flask — auth, journal d'entraînement, plans IA
├── web/         # Application React + TypeScript
├── render.yaml  # Blueprint de déploiement de l'API sur Render
└── netlify.toml # Configuration de build/déploiement du frontend sur Netlify
```

## Stack

- **API** : Python (Flask), JWT (`flask-jwt-extended`), BCrypt, MongoDB (`pymongo`), API Claude (Anthropic) pour les plans adaptatifs
- **Web** : React + TypeScript (Vite), Tailwind CSS (responsive + dark mode), React Router, Recharts
- **Base de données** : MongoDB Atlas
- **Déploiement** : Render (api/) + Netlify (web/), CI/CD via push GitHub

## Démarrage local

### API

```bash
cd api
python -m venv .venv
.venv/Scripts/activate  # Windows
cp .env.example .env    # puis renseigner MONGODB_URI, JWT_SECRET_KEY, ANTHROPIC_API_KEY
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

## Statut

- Auth (inscription/connexion/JWT/rôles) : fait
- Fondations frontend (routing, dark mode, contexte auth) : fait
- Journal d'entraînement, plan IA, dashboard, admin : à venir
