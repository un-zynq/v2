/**
 * HRN Core v7.0 - Data Driven Game Engine
 * Developed by The HyperRush Network
 * Focus: Data integrity, Performance, 528 Games Scale
 */
export class HRN {
  constructor() {
    this.source = "https://un-zynq.github.io/games2.json";
    this.cdn = "https://cdn.jsdelivr.net/gh/un-zynq/splash-images";
    this.data = [];
    this.favs = JSON.parse(localStorage.getItem("hrn_f")) || [];
    this.history = JSON.parse(localStorage.getItem("hrn_h")) || [];
    this.active = null;
  }

  /**
   * Laadt de 528 games met Stale-While-Revalidate caching.
   * Returnt de volledige geparseerde array.
   */
  async load() {
    try {
      const cache = await caches.open('hrn-v7-cache');
      const cached = await cache.match(this.source);
      
      if (cached) {
        this._parse(await cached.json());
        // Background update
        fetch(this.source).then(r => r.json()).then(j => {
          this._parse(j);
          cache.put(this.source, new Response(JSON.stringify(j)));
        });
      } else {
        const r = await fetch(this.source);
        const j = await r.json();
        this._parse(j);
        cache.put(this.source, new Response(JSON.stringify(j)));
      }
      return this.data;
    } catch (e) {
      console.error("HRN Load Error:", e);
      return [];
    }
  }

  /**
   * Private method: Transformeert de gestripte JSON naar bruikbare objecten.
   */
  _parse(j) {
    this.data = j.flatMap(shard => 
      Object.entries(shard).flatMap(([group, games]) => 
        Object.entries(games).map(([key, info]) => ({
          ...info,
          alias: key,
          group: group,
          url: `${group}/${key}`,
          splash: `${this.cdn}/${group}/${key}.webp`,
          isFav: this.favs.includes(key),
          rank: info.rank || 0
        }))
      )
    );
  }

  // --- DATA QUERIES ---

  all() { return [...this.data]; }

  get(alias) { return this.data.find(g => g.alias === alias) || null; }

  search(query) {
    const s = query.toLowerCase();
    return this.data.filter(g => 
      g.name.toLowerCase().includes(s) || g.alias.toLowerCase().includes(s)
    ).sort((a, b) => b.rank - a.rank);
  }

  filter(key, value) { return this.data.filter(g => g[key] === value); }

  groups() { return [...new Set(this.data.map(g => g.group))].sort(); }

  random(n = 1) {
    const s = [...this.data].sort(() => 0.5 - Math.random());
    return n === 1 ? s[0] : s.slice(0, n);
  }

  // --- STATE MANAGEMENT ---

  toggleFav(alias) {
    const idx = this.favs.indexOf(alias);
    if (idx === -1) this.favs.push(alias);
    else this.favs.splice(idx, 1);
    
    localStorage.setItem("hrn_f", JSON.stringify(this.favs));
    const g = this.get(alias);
    if (g) g.isFav = (idx === -1);
    return g;
  }

  getFavs() { return this.data.filter(g => this.favs.includes(g.alias)); }

  logHistory(alias) {
    this.history = [alias, ...this.history.filter(x => x !== alias)].slice(0, 20);
    localStorage.setItem("hrn_h", JSON.stringify(this.history));
  }

  getHistory() { 
    return this.history.map(a => this.get(a)).filter(Boolean); 
  }

  // --- ENGINE / RUNTIME ---

  /**
   * Bereidt de game voor om te spelen.
   * Returnt een object met de nodige info, maar bouwt GEEN HTML.
   */
  boot(alias) {
    const game = this.get(alias);
    if (!game) return null;
    this.logHistory(alias);
    this.active = game;
    return {
      ...game,
      timestamp: Date.now()
    };
  }

  /**
   * Handige helper voor meta-tags, puur data-driven.
   */
  getMeta(alias) {
    const g = this.get(alias);
    if (!g) return null;
    return {
      title: `${g.name} | HRN Core`,
      description: `Play ${g.name} on the HyperRush Network.`,
      image: g.splash,
      url: window.location.href
    };
  }

  stats() {
    return {
      total: this.data.length,
      groups: this.groups(),
      lastUpdated: new Date().toISOString()
    };
  }
}
