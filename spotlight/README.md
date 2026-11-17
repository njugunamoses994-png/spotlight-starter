# SPOTLIGHT — Movie discovery starter

A responsive movie discovery website powered by the TMDB API. It includes trending movies, popular movies, genre browsing, search, movie details, trailers when available, and a device-local watchlist.

## 1. Get a TMDB API Read Access Token

1. Create or sign in to a TMDB account: https://www.themoviedb.org/signup
2. Open your account settings and choose **API**.
3. Request an API key using the developer option and follow TMDB's terms.
4. Copy the **API Read Access Token** (the long token, not a password).

Official docs: https://developer.themoviedb.org/docs/authentication-application

## 2. Add your token

Copy `.env.example` and name the copy `.env`:

```bash
cp .env.example .env
```

Open `.env` and replace `YOUR_TMDB_READ_ACCESS_TOKEN` with your token. Never put this token in `public/app.js`, HTML, or a public GitHub repository.

## 3. Run the website

Install Node.js (version 18 or newer), then open a terminal in this folder and run:

```bash
npm install
npm start
```

Open http://localhost:3000 in your browser.

## Project structure

- `server.js` — Express backend; keeps the TMDB token on the server and proxies API requests.
- `public/index.html` — page structure.
- `public/styles.css` — responsive styling.
- `public/app.js` — movie retrieval, search, filters, details and watchlist.
- `.env.example` — environment variable template.

## Notes

- The watchlist is saved in the current browser/device using localStorage. It is not synced between devices.
- The site uses TMDB movie metadata and poster images. Check TMDB's current API terms and attribution requirements before publishing or monetizing.
- Required attribution is included in the footer: “This product uses the TMDB API but is not endorsed or certified by TMDB.”
- This is a starter project, not a production deployment. Before launch, add rate limiting, input validation, secure hosting, monitoring, and a proper privacy policy.
