# Hero Puzzle Tableau

Two-player web game: reserve a cell on a 10×10 board, solve a math problem to reveal that tile, and be the first to name the hero behind the puzzle.

## Run locally
```
npm install
npm start        # http://localhost:3000
```

## Deploy (GitHub + Railway)
1. Create a GitHub repo and push this folder:
   `git init && git add . && git commit -m "Puzzle Tableau" && git branch -M main && git remote add origin <your-repo-url> && git push -u origin main`
2. Railway: New Project > Deploy from GitHub repo > pick the repo. Railway detects Node and runs `npm start`. No variables needed (it sets PORT).
3. In the service: Settings > Networking > Generate Domain. That public URL is your game link (WebSockets work on it).
4. Keep it at 1 replica: rooms live in server memory and are lost on redeploy/restart.

## Project layout
- `server.js` rooms, rules, timers, WebSocket sync. Tiles are served only to players who earned them.
- `questions.js` question depository: add a category to `CATEGORIES` (a function returning `{text, answer}`).
- `assets/pictures/` YOUR pictures (jpg/png/webp/svg). File name = displayed name. Cropped to a square and cut into 10x10 tiles automatically; small portraits are made from the same file.
- `assets/heroes/` built-in sample heroes, used only while `assets/pictures/` has no images.
- `gen-heroes.js` regenerates the 10 sample heroes.
- `public/index.html` the whole client.
