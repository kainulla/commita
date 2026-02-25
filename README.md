# Commita

![Commita](https://commita-eta.vercel.app/kainulla?theme=dark)

Generate an SVG card with your GitHub commit stats. Embed it in your README.

**Live**: [commita-eta.vercel.app](https://commita-eta.vercel.app)

## What it shows

- Total commits and repos scanned
- Most active day and hour
- Current and longest streak
- Shortest and longest commit messages
- Top emoji used in commits

## Usage

Embed in your GitHub README:

```md
![Commita](https://commita-eta.vercel.app/YOUR_USERNAME?theme=dark)
```

Or get raw JSON:

```
GET /YOUR_USERNAME/json
```

## Setup

```bash
npm install
npm run dev
```
