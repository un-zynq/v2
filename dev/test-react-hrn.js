"use strict";

/**
 * HRN_UI Framework
 * Een lichtgewicht React-achtig framework specifiek voor de HRN_Core.
 */
class HRN_UI {
  constructor(core, mountPoint) {
    this.core = core;
    this.container = document.querySelector(mountPoint);
    this.state = {
      view: "all", // "all", "favs", "supported"
      searchQuery: "",
      loading: true
    };

    // Binding
    this.render = this.render.bind(this);
  }

  // State Management: Update de state en trigger een re-render
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this._updateCoreAndRender();
  }

  async _updateCoreAndRender() {
    this.state.loading = true;
    
    // Filter de core op basis van state
    this.core.reset();
    if (this.state.searchQuery) this.core.search(this.state.searchQuery);
    if (this.state.view === "favs") this.core.filterFavorites();
    if (this.state.view === "supported") this.core.filterSupported();
    
    this.state.loading = false;
    this.render();
  }

  // Template voor een individuele Game Card
  GameCard(game) {
    return `
      <div class="game-card ${game.isSupported ? '' : 'unsupported'}">
        <div class="thumb-container">
          <img src="${game.thumb}" alt="${game.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
          <button class="fav-btn ${game.isFavorite ? 'active' : ''}" onclick="UI.toggleFav('${game.alias}')">
            ${game.isFavorite ? '★' : '☆'}
          </button>
        </div>
        <div class="game-info">
          <h3>${game.name}</h3>
          <span class="category">${game.category || 'Game'}</span>
          <button class="play-btn" onclick="UI.playGame('${game.url}')">SPELEN</button>
        </div>
      </div>
    `;
  }

  // De Main Render functie (De 'App' component)
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="hrn-wrapper">
        <header class="hrn-header">
          <h1>HRN<span>Games</span></h1>
          <div class="search-bar">
            <input type="text" placeholder="Zoek games..." 
                   value="${this.state.searchQuery}" 
                   oninput="UI.handleSearch(this.value)">
          </div>
        </header>

        <nav class="hrn-nav">
          <button class="${this.state.view === 'all' ? 'active' : ''}" onclick="UI.setState({view: 'all'})">Alle</button>
          <button class="${this.state.view === 'supported' ? 'active' : ''}" onclick="UI.setState({view: 'supported'})">📱 Voor mijn device</button>
          <button class="${this.state.view === 'favs' ? 'active' : ''}" onclick="UI.setState({view: 'favs'})">❤️ Favorieten</button>
        </nav>

        <main class="game-grid">
          ${this.state.loading ? '<div class="loader">Laden...</div>' : 
            this.core.list.length > 0 
              ? this.core.list.map(game => this.GameCard(game)).join('')
              : '<div class="no-results">Geen games gevonden...</div>'
          }
        </main>
      </div>
    `;
  }

  // Event Handlers
  handleSearch(val) {
    // Debounce-achtig gedrag
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.setState({ searchQuery: val });
    }, 300);
  }

  toggleFav(alias) {
    this.core.toggleFavorite(alias);
    this.render(); // Directe re-render
  }

  playGame(url) {
    console.log("Start game:", url);
    window.open(url, '_blank');
  }
}

/**
 * STYLING (Injecteer automatisch in de head)
 */
const style = document.createElement('style');
style.textContent = `
  :root { --primary: #ff4757; --bg: #0f0f0f; --card-bg: #1e1e1e; --text: #ffffff; }
  .hrn-wrapper { font-family: 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding: 20px; }
  .hrn-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .hrn-header h1 span { color: var(--primary); }
  .search-bar input { background: #2f3542; border: none; padding: 10px 20px; border-radius: 20px; color: white; width: 250px; }
  .hrn-nav { margin-bottom: 30px; display: flex; gap: 10px; }
  .hrn-nav button { background: transparent; border: 1px solid #333; color: white; padding: 8px 16px; border-radius: 5px; cursor: pointer; transition: 0.3s; }
  .hrn-nav button.active { background: var(--primary); border-color: var(--primary); }
  .game-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
  .game-card { background: var(--card-bg); border-radius: 12px; overflow: hidden; transition: transform 0.2s; position: relative; }
  .game-card:hover { transform: translateY(-5px); }
  .game-card.unsupported { opacity: 0.5; filter: grayscale(1); }
  .thumb-container { position: relative; aspect-ratio: 16/9; }
  .thumb-container img { width: 100%; height: 100%; object-fit: cover; }
  .fav-btn { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); border: none; color: white; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; }
  .fav-btn.active { color: #f1c40f; }
  .game-info { padding: 15px; }
  .game-info h3 { margin: 0 0 5px 0; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .category { font-size: 0.8rem; color: #888; display: block; margin-bottom: 10px; }
  .play-btn { width: 100%; background: var(--primary); border: none; color: white; padding: 8px; border-radius: 5px; font-weight: bold; cursor: pointer; }
`;
document.head.appendChild(style);

/**
 * INITIALISATIE
 */
(async () => {
  // Wacht tot de Core is geladen
  await HRN.init();
  
  // Start de UI op een element met id #app
  window.UI = new HRN_UI(HRN, '#app');
  UI.render();
})();
