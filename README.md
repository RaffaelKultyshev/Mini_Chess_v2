# 3D Chess Game

Een interactieve 3D schaakspel dat in de browser speelbaar is, gemaakt met Three.js en chess.js.

## Features

- 🎮 Volledig functioneel schaakspel
- 🎨 3D graphics met Three.js
- 🖱️ Intuïtieve muisbesturing
- ✨ Animaties voor stukbewegingen
- 🎯 Visuele highlights voor geldige zetten
- 📱 Responsive design

## Lokaal draaien

1. Installeer dependencies:
```bash
npm install
```

2. Start de server:
```bash
npm start
```

3. Open je browser en ga naar `http://localhost:3000`

## Deployment op Render

1. Push je code naar GitHub
2. Maak een nieuwe Web Service op Render
3. Verbind je GitHub repository
4. Render detecteert automatisch de `render.yaml` configuratie
5. De app wordt automatisch gedeployed

### Render Instellingen:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node

## GitHub Setup

1. Initialiseer git repository:
```bash
git init
git add .
git commit -m "Initial commit: 3D Chess Game"
```

2. Maak een nieuwe repository op GitHub

3. Push naar GitHub:
```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

## Technologieën

- **Three.js** - 3D graphics library
- **chess.js** - Chess game logic
- **Express.js** - Web server
- **Node.js** - Runtime environment

## Spelregels

- Klik op een stuk om het te selecteren
- Geldige zetten worden gehighlight
- Klik op een gehighlight vakje om te bewegen
- Het spel volgt standaard schaakregels
- Promotie naar dame gebeurt automatisch

## Licentie

MIT

