# Portfolio Angular — CV Interactif

Portfolio personnel développé avec **Angular 17** (standalone components, signals), TypeScript et SCSS.

## 🚀 Lancer en local

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur de développement
npm start
# → http://localhost:4200
```

## 📦 Builder pour production

```bash
npm run build
# Sortie dans dist/portfolio/browser/
```

## 🌐 Déployer sur GitHub Pages

### Méthode automatique (recommandée)

1. **Créer un repo GitHub** nommé `portfolio` (ou ce que vous voulez)
2. **Pousser le code** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/VOTRE_USERNAME/portfolio.git
   git push -u origin main
   ```
3. **Activer GitHub Pages** dans Settings → Pages → Source: "GitHub Actions"
4. Le workflow `.github/workflows/deploy.yml` se déclenche automatiquement ✅

### ⚠️ Adapter le base-href

Dans `package.json`, le script `build:gh-pages` utilise `--base-href /portfolio/`.
Si votre repo s'appelle différemment, changez ce nom :
```json
"build:gh-pages": "ng build --base-href /NOM_DU_REPO/"
```

---

## ✏️ Personnaliser le contenu

| Fichier | Ce qu'il faut modifier |
|---|---|
| `src/app/components/hero/hero.component.ts` | Titre, description, stack technique |
| `src/app/components/experiences/experiences.component.ts` | Vos expériences professionnelles |
| `src/app/components/projects/projects.component.ts` | Vos projets (titre, description, URLs GitHub) |
| `src/app/components/contact/contact.component.ts` | Email, GitHub, LinkedIn, Twitter |
| `src/app/app.component.ts` | Votre prénom dans le footer |
| `src/index.html` | Balise `<title>` |

---

## 🎮 Mini-jeux inclus

- **⚽ Penalty Shootout** : Choisissez gauche / centre / droite, le gardien plonge aléatoirement
- **🚴 Infinite Rider** : Évitez les obstacles (rochers, nids-de-poule, cônes) en sautant avec Espace ou clic

---

## 🗂️ Structure du projet

```
src/
├── app/
│   ├── components/
│   │   ├── nav/              # Barre de navigation fixe
│   │   ├── hero/             # Section d'accueil
│   │   ├── experiences/      # Timeline des expériences
│   │   ├── projects/         # Grille de projets
│   │   ├── football-game/    # Mini-jeu penalty (Canvas)
│   │   ├── cycling-game/     # Mini-jeu vélo (Canvas)
│   │   └── contact/          # Liens de contact
│   └── app.component.ts      # Racine
├── styles.scss                # Variables CSS globales
└── index.html
```

## 🎨 Palette de couleurs

| Variable | Couleur | Utilisation |
|---|---|---|
| `--accent1` | `#ff6b35` | Orange — CTA principal |
| `--accent2` | `#7c5cfc` | Violet — Angular / tech |
| `--accent3` | `#00e5a0` | Vert — Succès, disponibilité |
| `--accent4` | `#ffd166` | Jaune — Highlights |
