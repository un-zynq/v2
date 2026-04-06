export class HRN {
  constructor() {
    this.source = "https://un-zynq.github.io/games2.json";
    this.cdn = "https://cdn.jsdelivr.net/gh/un-zynq/splash-images";
    this.data = [];
    this.favs = JSON.parse(localStorage.getItem("hrn_f")) || [];
    this.h = JSON.parse(localStorage.getItem("hrn_h")) || [];
    this.activeGame = null;
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
    if (i === -1) {
      this.favs.push(a);
    } else {
      this.favs.splice(i, 1);
    }
    localStorage.setItem("hrn_f", JSON.stringify(this.favs));
    const g = this.get(a);
    if (g) g.isFav = i === -1;
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

  launch(a, target) {
    const g = this.get(a);
    if (!g) return;
    this.log(a);
    this.activeGame = g;
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;
    
    el.innerHTML = `
      <div id="hrn-player" style="position:relative;width:100%;height:100%;background:#000;overflow:hidden;">
        <div id="hrn-splash" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:url('${g.splash}') center/cover no-repeat;z-index:2;transition:opacity .5s;">
          <div style="background:rgba(0,0,0,0.6);padding:2rem;border-radius:1rem;text-align:center;backdrop-filter:blur(5px);color:#fff;">
            <h2 style="margin:0 0 1rem 0;font-family:sans-serif;">${g.name}</h2>
            <div style="width:50px;height:50px;border:5px solid #fff;border-top-color:transparent;border-radius:50%;animation:hrn-spin 1s linear infinite;"></div>
          </div>
        </div>
        <iframe id="hrn-frame" src="${g.url}" style="width:100%;height:100%;border:none;opacity:0;transition:opacity .5s;" allow="autoplay;fullscreen;keyboard"></iframe>
      </div>
      <style>
        @keyframes hrn-spin { to { transform: rotate(360deg); } }
      </style>
    `;

    const fr = el.querySelector('#hrn-frame');
    const sp = el.querySelector('#hrn-splash');
    
    fr.onload = () => {
      setTimeout(() => {
        sp.style.opacity = '0';
        fr.style.opacity = '1';
        setTimeout(() => sp.remove(), 500);
      }, 1500);
    };
  }

  injectMeta(a) {
    const g = this.get(a);
    if (!g) return;
    document.title = `${g.name} - HRN Engine`;
    const meta = {
      "description": `Speel ${g.name} op de HRN portal.`,
      "og:title": g.name,
      "og:image": g.splash,
      "og:type": "website"
    };
    Object.entries(meta).forEach(([k, v]) => {
      let m = document.querySelector(`meta[name="${k}"], meta[property="${k}"]`);
      if (!m) {
        m = document.createElement('meta');
        if (k.startsWith('og:')) m.setAttribute('property', k);
        else m.setAttribute('name', k);
        document.head.appendChild(m);
      }
      m.content = v;
    });
  }

  preload(n = 5) {
    this.data.slice(0, n).forEach(g => {
      const img = new Image();
      img.src = g.splash;
    });
  }
}
