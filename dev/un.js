export class HRN {
  constructor() {
    this.source = "https://un-zynq.github.io/games2.json";
    this.cdn = "https://cdn.jsdelivr.net/gh/un-zynq/splash-images";
    this.data = [];
    this._map = new Map();
    this.favs = [];
  }

  async load() {
    try {
      // 1. Probeer browser cache (alleen in browser)
      if (typeof window !== 'undefined' && window.caches) {
        const cache = await caches.open('hrn-v7-cache');
        const cached = await cache.match(this.source);
        if (cached) {
          this._parse(await cached.json());
          this._bgUpdate(cache);
          return this.data;
        }
      }

      // 2. Fetch data (werkt in Node 18+ en browser)
      const r = await fetch(this.source);
      const j = await r.json();
      return this._parse(j);
    } catch (e) {
      console.error("HRN Load Error:", e);
      return [];
    }
  }

  _parse(j) {
    const list = [];
    const map = new Map();

    j.forEach(shard => {
      Object.entries(shard).forEach(([group, games]) => {
        Object.entries(games).forEach(([key, info]) => {
          const { rank, ...cleanInfo } = info;
          const game = {
            ...cleanInfo,
            alias: key,
            url: `${group}/${key}`,
            splash: `${this.cdn}/${group}/${key}.webp`
          };
          list.push(game);
          map.set(key, game);
        });
      });
    });

    this.data = list.sort((a, b) => a.name.localeCompare(b.name));
    this._map = map;
    return this.data;
  }

  all() { return this.data; }
  get(alias) { return this._map.get(alias) || null; }
  
  search(query) {
    const s = query.toLowerCase();
    return this.data.filter(g => 
      g.name.toLowerCase().includes(s) || g.alias.includes(s)
    );
  }

  async _bgUpdate(cache) {
    try {
      const r = await fetch(this.source);
      const j = await r.json();
      this._parse(j);
      cache.put(this.source, new Response(JSON.stringify(j)));
    } catch(e) {}
  }
}

// Export een nieuwe instantie
export const hrn = new HRN();
