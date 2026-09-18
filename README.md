# AI-Running-Coach

Application de suivi d'entraînement sportif intégrant des recommandations générées par IA (plans d'entraînement adaptatifs).

## Structure du repo (monorepo)

```
AI-Running-Coach/
├── api/         # API Python (Flask/Django) — logique métier, recommandations IA
├── web/         # Application React
├── render.yaml  # Blueprint de déploiement de l'API sur Render
└── netlify.toml # Configuration de build/déploiement du frontend sur Netlify
```

## Stack cible

- **Backend** : Python (Flask/Django)
- **Frontend** : React
- **Base de données** : MongoDB Atlas
- **Déploiement** : Render (backend) + Netlify (frontend), CI/CD via push GitHub

## Statut

Squelette de repo en place. Le code applicatif reste à implémenter.
