export class HRN {
  constructor() {
    this.source = "https://un-zynq.github.io/games2.json";
    this.cdn = "https://cdn.jsdelivr.net/gh/un-zynq/splash-images";
    this.data = [];
    this.favs = JSON.parse(localStorage.getItem("hrn_f")) || [];
    this.h = JSON.parse(localStorage.getItem("hrn_h")) || [];
    this.activeGame = null;
    this.startTime = null;
  }

  async load() {
    try {
      const cache = await caches.open('hrn-cache');
      const cachedResponse = await cache.match(this.source);
      
      if (cachedResponse) {
        this._parse(await cachedResponse.json());
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
      return [];
    }
  }

  _parse(j) {
    this.data = j.flatMap(shard => 
      Object.entries(shard).flatMap(([groupName, games]) => 
        Object.entries(games).map(([key, info]) => ({
          ...info,
          alias: key,
          group: groupName,
          url: `${groupName}/${key}`,
          splash: `${this.cdn}/${groupName}/${key}.webp`,
          isFav: this.favs.includes(key),
          rank: info.rank || 0
        }))
      )
    );
  }

  all() { return [...this.data]; }

  get(a) { return this.data.find(g => g.alias === a) || null; }

  search(q) {
    const s = q.toLowerCase();
    return this.data.filter(g => 
      g.name.toLowerCase().includes(s) || 
      g.alias.toLowerCase().includes(s)
    ).sort((a, b) => b.rank - a.rank);
  }

  filter(k, v) { return this.data.filter(g => g[k] === v); }

  groups() { return [...new Set(this.data.map(g => g.group))].sort(); }

  random(n = 1) {
    const s = [...this.data].sort(() => 0.5 - Math.random());
    return n === 1 ? s[0] : s.slice(0, n);
  }

  fav(a) {
    const i = this.favs.indexOf(a);
    i === -1 ? this.favs.push(a) : this.favs.splice(i, 1);
    localStorage.setItem("hrn_f", JSON.stringify(this.favs));
    const g = this.get(a);
    if (g) g.isFav = i === -1;
    return this.getFavs();
  }

  getFavs() { return this.data.filter(g => this.favs.includes(g.alias)); }

  log(a) {
    this.h = [a, ...this.h.filter(x => x !== a)].slice(0, 15);
    localStorage.setItem("hrn_h", JSON.stringify(this.h));
  }

  getHistory() { return this.h.map(a => this.get(a)).filter(Boolean); }

  launch(a, target) {
    const g = this.get(a);
    if (!g) return;
    
    this.log(a);
    this.activeGame = g;
    this.startTime = Date.now();
    
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;

    el.innerHTML = `
      <div id="hrn-p" style="position:relative;width:100%;height:100%;background:#000;overflow:hidden;border-radius:inherit;">
        <div id="hrn-s" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:url('${g.splash}') center/cover no-repeat;z-index:10;transition:all .8s ease-in-out;">
          <div style="position:absolute;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(15px);"></div>
          <div style="position:relative;z-index:11;text-align:center;color:#fff;font-family:sans-serif;">
            <img src="${g.splash}" style="width:200px;aspect-ratio:4/3;object-fit:cover;border-radius:15px;margin-bottom:1.5rem;box-shadow:0 20px 50px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);">
            <h2 style="margin:0;font-size:1.8rem;font-weight:900;letter-spacing:-0.5px;">${g.name}</h2>
            <div style="width:150px;height:4px;background:rgba(255,255,255,0.1);border-radius:10px;margin:2rem auto;overflow:hidden;">
              <div id="hrn-b" style="width:0%;height:100%;background:#3b82f6;transition:width 1.5s cubic-bezier(0.4, 0, 0.2, 1);"></div>
            </div>
          </div>
        </div>
        <iframe id="hrn-f" src="${g.url}" style="width:100%;height:100%;border:none;opacity:0;transition:opacity .5s;" allow="autoplay;fullscreen;keyboard;pointer-lock"></iframe>
        <button id="hrn-x" style="position:absolute;top:20px;right:20px;z-index:20;background:rgba(0,0,0,0.5);color:#fff;border:none;width:40px;height:40px;border-radius:50%;cursor:pointer;display:none;align-items:center;justify-content:center;font-size:24px;backdrop-filter:blur(5px);">&times;</button>
      </div>
    `;

    const f = el.querySelector('#hrn-f'), s = el.querySelector('#hrn-s'), b = el.querySelector('#hrn-b'), x = el.querySelector('#hrn-x');
    setTimeout(() => b.style.width = '100%', 50);

    f.onload = () => {
      setTimeout(() => {
        s.style.opacity = '0';
        s.style.transform = 'scale(1.1)';
        f.style.opacity = '1';
        x.style.display = 'flex';
        setTimeout(() => s.remove(), 800);
      }, 1200);
    };

    x.onclick = () => {
      el.innerHTML = '';
      this.activeGame = null;
    };
  }

  injectMeta(a) {
    const g = this.get(a);
    if (!g) return;
    document.title = g.name;
    const m = { "description": `Play ${g.name}`, "og:title": g.name, "og:image": g.splash };
    Object.entries(m).forEach(([k, v]) => {
      let t = document.querySelector(`meta[name="${k}"], meta[property="${k}"]`);
      if (!t) {
        t = document.createElement('meta');
        k.startsWith('og:') ? t.setAttribute('property', k) : t.setAttribute('name', k);
        document.head.appendChild(t);
      }
      t.content = v;
    });
  }

  suggest(a, n = 5) {
    const g = this.get(a);
    return this.data.filter(x => x.group === (g?.group || '') && x.alias !== a).sort(() => 0.5 - Math.random()).slice(0, n);
  }

  stats() {
    return {
      total: this.data.length,
      groups: this.groups(),
      memory: Math.round(JSON.stringify(this.data).length / 1024) + "KB"
    };
  }

  preload(n = 10) {
    this.data.slice(0, n).forEach(g => {
      const l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = g.splash;
      document.head.appendChild(l);
    });
  }

  reset() {
    localStorage.removeItem("hrn_f");
    localStorage.removeItem("hrn_h");
    this.favs = [];
    this.h = [];
  }
}
