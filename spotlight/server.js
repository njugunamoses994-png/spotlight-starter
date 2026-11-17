import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TMDB_ACCESS_TOKEN;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, 'public')));

async function tmdb(pathname, params = {}) {
  if (!TOKEN || TOKEN === 'YOUR_TMDB_READ_ACCESS_TOKEN') {
    const error = new Error('TMDB token is missing. Add it to your .env file.');
    error.status = 503;
    throw error;
  }
  const url = new URL(`https://api.themoviedb.org/3${pathname}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' }
  });
  if (!response.ok) {
    const error = new Error(`TMDB returned ${response.status}. Check your token and try again.`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

app.get('/api/trending', async (_req, res) => {
  try { res.json(await tmdb('/trending/movie/week', { language: 'en-US' })); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

app.get('/api/popular', async (_req, res) => {
  try { res.json(await tmdb('/movie/popular', { language: 'en-US', page: 1 })); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

app.get('/api/genres', async (_req, res) => {
  try { res.json(await tmdb('/genre/movie/list', { language: 'en-US' })); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

app.get('/api/discover', async (req, res) => {
  try {
    res.json(await tmdb('/discover/movie', {
      language: 'en-US', sort_by: 'popularity.desc', include_adult: 'false',
      with_genres: req.query.genre || '', page: req.query.page || '1'
    }));
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

app.get('/api/search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.json({ results: [] });
    res.json(await tmdb('/search/movie', { query, include_adult: 'false', language: 'en-US', page: 1 }));
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

app.get('/api/movie/:id', async (req, res) => {
  try {
    res.json(await tmdb(`/movie/${encodeURIComponent(req.params.id)}`, {
      language: 'en-US', append_to_response: 'credits,videos'
    }));
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`SPOTLIGHT is running at http://localhost:${PORT}`);
  if (!TOKEN) console.log('Add TMDB_ACCESS_TOKEN to your .env file to enable movie retrieval.');
});
