# Deutsch Lernen (Learn German)

An elegant flashcard app that helps complete beginners learn their first German words. Nouns include der/die/das so learners pick up each word's gender.

- 6 built-in decks (Greetings, Food, Colors, Numbers, Animals, Family), 15 words each, plus **Mix all decks**
- **Flip cards:** tap a card to flip it, then mark **I knew it** or **Still learning**
- **Quiz:** pick the right meaning from 4 choices, with instant feedback
- **Show first:** study German → English or English → German
- **🔊 Listen:** hear the German word using your browser's built-in voice
- See your score and retry only the words you missed
- Add your own words for this visit (they reset when you refresh)
- Keyboard: flip cards use **Space** to flip, **→** for I knew it, **←** for Still learning; the quiz uses **1–4** to answer and **Enter** for the next word

## Run it on your computer

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

After changing `server.js` (for example, editing the word lists), stop the server with **Ctrl+C** and run `npm start` again. Changes to files in `public/` only need a browser refresh.

## Project files

| File | What it does |
| --- | --- |
| `package.json` | Project info, the `npm start` command, and the one dependency (Express) |
| `server.js` | Express server: serves the `public` folder and the built-in decks at `/api/decks` |
| `public/index.html` | The page: Home, Study and Results screens |
| `public/style.css` | Midnight-and-gold theme, layout, the card flip animation, phone layout. Fonts (Playfair Display, Inter) load from Google Fonts with built-in fallbacks |
| `public/script.js` | App logic: loads decks, flip cards, quiz, listen, scoring, custom words |

To add or change built-in words, edit the `decks` list in `server.js`.

## Deploy on Render

1. Push this folder to a GitHub repository.
2. On [render.com](https://render.com), choose **New → Web Service** and connect the repository.
3. Use these settings:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
4. Click **Create Web Service**. Render gives you a public URL and redeploys every time you push to GitHub.

On the free plan the app sleeps after about 15 minutes without visitors, so the first visit after that can take around 30 seconds to load.
