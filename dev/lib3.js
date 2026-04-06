export class HRN {
  constructor() {
    this.source = "https://un-zynq.github.io/games2.json";
    this.cdn = "https://cdn.jsdelivr.net/gh/un-zynq/splash-images";
    this.data = [];
    this.favs = JSON.parse(localStorage.getItem("hrn_f")) || [];
    this.h = JSON.parse(localStorage.getItem("hrn_h")) || [];
  }

  async load() {
    try {
      const r = await fetch(this.source);
      const j = await r.json();
      this.data = j.flatMap(e => 
        Object.entries(e).flatMap(([g, items]) => 
          Object.values(items).map(i => ({
            ...i,
            group: g,
            splash: `${this.cdn}/${g}/${i.alias}.webp`,
            isFav: this.favs.includes(i.alias)
          }))
        )
      );
      return this.data;
    } catch (e) {
      return [];
    }
  }

  all() { return [...this.data]; }

  get(a) { return this.data.find(g => g.alias === a) || null; }

  search(q) {
    const s = q.toLowerCase();
    return this.data.filter(g => g.name.toLowerCase().includes(s) || g.alias.includes(s));
  }

  filter(k, v) { return this.data.filter(g => g[k] === v); }

  groups() { return [...new Set(this.data.map(g => g.group))]; }

  random(n = 1) {
    const s = [...this.data].sort(() => 0.5 - Math.random());
    return n === 1 ? s[0] : s.slice(0, n);
  }

  sort(p = "name", d = false) {
    const s = [...this.data].sort((a, b) => a[p] > b[p] ? 1 : -1);
    return d ? s.reverse() : s;
  }

  page(n, s = 20) { return this.data.slice(n * s, (n + 1) * s); }

  fav(a) {
    const i = this.favs.indexOf(a);
    i === -1 ? this.favs.push(a) : this.favs.splice(i, 1);
    localStorage.setItem("hrn_f", JSON.stringify(this.favs));
    this.data.forEach(g => { if(g.alias === a) g.isFav = !i===-1; });
    return this.getFavs();
  }

  getFavs() { return this.data.filter(g => this.favs.includes(g.alias)); }

  log(a) {
    this.h = [a, ...this.h.filter(x => x !== a)].slice(0, 10);
    localStorage.setItem("hrn_h", JSON.stringify(this.h));
  }

  getHistory() { return this.h.map(a => this.get(a)).filter(Boolean); }

  tag(t) { return this.data.filter(g => g.name.toLowerCase().includes(t.toLowerCase())); }

  stats() {
    return {
      total: this.data.length,
      shards: this.groups().length,
      distribution: this.groups().reduce((a, c) => ({...a, [c]: this.filter('group', c).length}), {})
    };
  }

  shuffle() { return [...this.data].sort(() => Math.random() - 0.5); }

  find(fn) { return this.data.find(fn); }

  exists(a) { return this.data.some(g => g.alias === a); }

  keys() { return this.data.length > 0 ? Object.keys(this.data[0]) : []; }

  latest(n = 10) { return this.data.slice(-n).reverse(); }

  reset() {
    localStorage.removeItem("hrn_f");
    localStorage.removeItem("hrn_h");
    this.favs = [];
    this.h = [];
  }
}
