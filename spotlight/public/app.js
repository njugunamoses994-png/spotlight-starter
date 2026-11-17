const API = '/api';
const IMAGE = 'https://image.tmdb.org/t/p/';
const $ = (selector) => document.querySelector(selector);
const state = { genres: [], watchlist: loadWatchlist(), heroMovie: null, searchTimer: null };

function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem('spotlight-watchlist') || '[]'); }
  catch { return []; }
}
function saveWatchlist() {
  localStorage.setItem('spotlight-watchlist', JSON.stringify(state.watchlist));
  $('#watch-count').textContent = state.watchlist.length;
  renderWatchlist();
}
function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function poster(path, size = 'w500') { return path ? `${IMAGE}${size}${path}` : ''; }
function year(date = '') { return date ? date.slice(0, 4) : 'Year unknown'; }
function rating(value) { return Number(value || 0).toFixed(1); }
function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2100);
}
async function api(path) {
  const response = await fetch(`${API}${path}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong while loading movies.');
  return data;
}
function card(movie) {
  const saved = state.watchlist.some(item => item.id === movie.id);
  const title = movie.title || movie.name || 'Untitled';
  return `<article class="movie-card" data-movie="${movie.id}">
    <div class="poster-wrap" role="button" tabindex="0" aria-label="View ${escapeHTML(title)}">
      ${movie.poster_path ? `<img loading="lazy" src="${poster(movie.poster_path)}" alt="${escapeHTML(title)} poster">` : `<div class="poster-placeholder">S.</div>`}
      <span class="rating"><b>★</b> ${rating(movie.vote_average)}</span>
      <button class="quick-save ${saved ? 'saved' : ''}" data-save="${movie.id}" aria-label="${saved ? 'Remove from' : 'Add to'} watchlist">${saved ? '✓' : '+'}</button>
    </div>
    <div class="movie-info"><h3 class="movie-title">${escapeHTML(title)}</h3><div class="movie-meta"><span>${year(movie.release_date)}</span><span>·</span><span>${movie.vote_count ? `${movie.vote_count.toLocaleString()} votes` : 'Movie'}</span></div></div>
  </article>`;
}
function renderMovies(target, movies, emptyMessage = 'No movies found.') {
  const element = $(target);
  element.innerHTML = movies?.length ? movies.map(card).join('') : `<p class="empty-state">${escapeHTML(emptyMessage)}</p>`;
}
async function loadHome() {
  try {
    const [trending, popular, genres] = await Promise.all([api('/trending'), api('/popular'), api('/genres')]);
    renderMovies('#trending-grid', trending.results || []);
    state.genres = genres.genres || [];
    renderGenres();
    renderMovies('#discover-grid', popular.results || []);
    const featured = (trending.results || []).find(movie => movie.backdrop_path && movie.overview) || trending.results?.[0];
    if (featured) setHero(featured);
  } catch (error) {
    const message = escapeHTML(error.message);
    ['#trending-grid', '#discover-grid'].forEach(id => $(id).innerHTML = `<p class="empty-state">${message}</p>`);
    showToast('Connect your TMDB token to load movies.');
  }
}
function setHero(movie) {
  state.heroMovie = movie;
  const title = movie.title || movie.name || 'Discover something great';
  $('#hero-title').innerHTML = `${escapeHTML(title)}<br><em>is in the spotlight.</em>`;
  $('#hero-kicker').textContent = `★ ${rating(movie.vote_average)} / 10  ·  ${year(movie.release_date)}`;
  $('#hero-description').textContent = movie.overview || 'Discover films worth your time. Explore what is trending and build your personal watchlist.';
  $('#hero').style.backgroundImage = movie.backdrop_path ? `url("${poster(movie.backdrop_path, 'w1280')}")` : 'none';
}
function renderGenres() {
  $('#genre-list').innerHTML = `<button class="genre-chip selected" data-genre="">All films</button>` + state.genres.map(genre => `<button class="genre-chip" data-genre="${genre.id}">${escapeHTML(genre.name)}</button>`).join('');
}
async function loadGenre(id) {
  $$('.genre-chip').forEach(button => button.classList.toggle('selected', button.dataset.genre === String(id)));
  $('#discover-grid').innerHTML = '<div class="loading-state">Finding films<span class="loader"></span></div>';
  try { const data = await api(`/discover?genre=${encodeURIComponent(id)}`); renderMovies('#discover-grid', data.results || []); }
  catch (error) { $('#discover-grid').innerHTML = `<p class="empty-state">${escapeHTML(error.message)}</p>`; }
}
function toggleWatchlist(movie) {
  const exists = state.watchlist.some(item => item.id === movie.id);
  state.watchlist = exists ? state.watchlist.filter(item => item.id !== movie.id) : [movie, ...state.watchlist];
  saveWatchlist(); showToast(exists ? 'Removed from your watchlist' : 'Added to your watchlist');
  document.querySelectorAll(`[data-save="${movie.id}"]`).forEach(button => {
    button.classList.toggle('saved', !exists); button.textContent = exists ? '+' : '✓';
  });
}
function renderWatchlist() {
  $('#watch-count').textContent = state.watchlist.length;
  renderMovies('#watchlist-grid', state.watchlist, 'Your watchlist is waiting. Save a movie to see it here.');
}
async function openMovie(id) {
  const dialog = $('#movie-dialog');
  $('#dialog-content').innerHTML = '<div class="loading-state">Loading movie details<span class="loader"></span></div>';
  dialog.showModal();
  try {
    const movie = await api(`/movie/${id}`);
    const saved = state.watchlist.some(item => item.id === movie.id);
    const cast = movie.credits?.cast?.slice(0, 4).map(person => person.name).join(', ');
    const genres = movie.genres?.map(genre => genre.name).join(' · ');
    const trailer = movie.videos?.results?.find(video => video.site === 'YouTube' && video.type === 'Trailer');
    $('#dialog-content').innerHTML = `<div class="dialog-layout">
      ${movie.poster_path ? `<img class="dialog-poster" src="${poster(movie.poster_path)}" alt="${escapeHTML(movie.title)} poster">` : '<div class="poster-placeholder">S.</div>'}
      <div class="dialog-copy"><p class="eyebrow">SPOTLIGHT FILM</p><h2>${escapeHTML(movie.title)}</h2>
      <p class="dialog-meta">${year(movie.release_date)} · ★ ${rating(movie.vote_average)} · ${escapeHTML(genres || 'Movie')}</p>
      <p class="dialog-overview">${escapeHTML(movie.overview || 'No description available yet.')}</p>
      ${cast ? `<p class="dialog-meta"><strong>Cast:</strong> ${escapeHTML(cast)}</p>` : ''}
      <div class="dialog-actions"><button class="btn btn-primary" id="dialog-save">${saved ? '✓ In your watchlist' : '+ Add to watchlist'}</button>${trailer ? ` <a class="text-link" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}">Watch trailer ↗</a>` : ''}</div>
      </div></div>`;
    $('#dialog-save').addEventListener('click', () => { toggleWatchlist(movie); $('#dialog-save').textContent = state.watchlist.some(item => item.id === movie.id) ? '✓ In your watchlist' : '+ Add to watchlist'; });
  } catch (error) { $('#dialog-content').innerHTML = `<p class="empty-state">${escapeHTML(error.message)}</p>`; }
}
function $$(selector) { return [...document.querySelectorAll(selector)]; }

$('#search-form').addEventListener('submit', async event => {
  event.preventDefault();
  const query = $('#search-input').value.trim(); if (!query) return;
  $('#search-results').classList.remove('hidden'); $('#search-heading').textContent = `Results for “${query}”`;
  $('#search-grid').innerHTML = '<div class="loading-state">Searching the movie universe<span class="loader"></span></div>';
  $('#search-results').scrollIntoView({ behavior: 'smooth' });
  try { const data = await api(`/search?q=${encodeURIComponent(query)}`); renderMovies('#search-grid', data.results || [], 'No movies matched that search. Try another title.'); }
  catch (error) { $('#search-grid').innerHTML = `<p class="empty-state">${escapeHTML(error.message)}</p>`; }
});
$('#clear-search').addEventListener('click', () => { $('#search-results').classList.add('hidden'); $('#search-input').value = ''; });
$('#genre-list').addEventListener('click', event => { const button = event.target.closest('[data-genre]'); if (button) loadGenre(button.dataset.genre); });
document.addEventListener('click', async event => {
  const saveButton = event.target.closest('[data-save]');
  if (saveButton) {
    event.stopPropagation(); const id = Number(saveButton.dataset.save);
    let movie = state.watchlist.find(item => item.id === id);
    if (!movie) {
      try { movie = await api(`/movie/${id}`); } catch (error) { showToast(error.message); return; }
    }
    toggleWatchlist(movie); return;
  }
  const movieCard = event.target.closest('.movie-card');
  if (movieCard) openMovie(movieCard.dataset.movie);
});
document.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.movie-card .poster-wrap')) {
    event.preventDefault(); openMovie(event.target.closest('.movie-card').dataset.movie);
  }
});
$('#hero-details').addEventListener('click', () => { if (state.heroMovie) openMovie(state.heroMovie.id); });
$('#dialog-close').addEventListener('click', () => $('#movie-dialog').close());
$('#movie-dialog').addEventListener('click', event => { if (event.target === $('#movie-dialog')) $('#movie-dialog').close(); });
renderWatchlist();
loadHome();
