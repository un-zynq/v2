"use strict";

(function () {

  // 🔧 --- BASIC FALLBACKS ---
  if (!Array.prototype.includes) {
    Array.prototype.includes = function (v) {
      return this.indexOf(v) !== -1;
    };
  }

  const hasFetch = typeof fetch !== "undefined";
  const hasMap = typeof Map !== "undefined";
  const hasSet = typeof Set !== "undefined";

  function simpleFetch(url) {
    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            json: () => Promise.resolve(JSON.parse(xhr.responseText))
          });
        } else reject("Fetch error");
      };
      xhr.onerror = reject;
      xhr.send();
    });
  }

  const doFetch = hasFetch ? fetch : simpleFetch;

  // 🧠 --- DEVICE DETECTION ---
  function detectDevice() {
    const ua = navigator.userAgent.toLowerCase();

    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    const isTablet =
      /tablet|ipad/.test(ua) ||
      (isTouch && Math.min(screen.width, screen.height) >= 768);

    const isPhone =
      /mobi|android|iphone/.test(ua) &&
      Math.min(screen.width, screen.height) < 768;

    if (isTablet) return 4;
    if (isPhone) return 3;
    if (isTouch) return 1;
    return 2;
  }

  // 🧱 --- MAIN CLASS ---
  window.HRN = new (class {

    constructor() {
      this.config = {
        src: "https://un-zynq.github.io/games2.json",
        cdn: "https://cdn.jsdelivr.net/gh/un-zynq/thumbnails"
      };

      this.data = [];
      this._map = hasMap ? new Map() : {};

      this.favs = this._initStorage("hrn_f", true);
      this.history = this._initStorage("hrn_h", false);

      this.deviceType = detectDevice();

      this.sorter =
        typeof Intl !== "undefined" && Intl.Collator
          ? new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })
          : null;
    }

    async load(filterByDevice = false) {
      try {
        const useCache = "caches" in window;

        if (useCache) {
          const cache = await caches.open("hrn-cache");
          const cached = await cache.match(this.config.src);

          if (cached) {
            const data = await cached.json();
            this._parse(data, filterByDevice);
            this._fetchAndCache(cache, filterByDevice).catch(() => {});
            return this.data;
          }

          return await this._fetchAndCache(cache, filterByDevice);
        }

        return await this._fetchStandard(filterByDevice);

      } catch (e) {
        console.error("HRN Load Error:", e);
        return [];
      }
    }

    async _fetchAndCache(cache, filter) {
      const res = await doFetch(this.config.src);
      const json = await res.json();

      this._parse(json, filter);
      cache.put(this.config.src, new Response(JSON.stringify(json)));

      return this.data;
    }

    async _fetchStandard(filter) {
      const res = await doFetch(this.config.src);
      const json = await res.json();
      return this._parse(json, filter);
    }

    _parse(input, filterByDevice) {
      if (!Array.isArray(input)) return this.data;

      const arr = [];
      const map = hasMap ? new Map() : {};

      for (let i = 0; i < input.length; i++) {
        const cat = input[i];

        for (const base in cat) {
          const group = cat[base];

          for (const alias in group) {
            const game = group[alias];

            let devices = null;

            if (game.devices) {
              devices = game.devices.split(",").map(n => parseInt(n));
            }

            // 🎯 FILTER
            if (filterByDevice && devices) {
              if (!devices.includes(this.deviceType)) continue;
            }

            const obj = {
              name: game.name,
              alias: alias,
              url: base + "/" + alias,
              splash: this.config.cdn + "/" + base + "/" + alias + ".webp",
              devices: devices,
              isFav: this._hasFav(alias)
            };

            arr.push(obj);

            if (hasMap) map.set(alias, obj);
            else map[alias] = obj;
          }
        }
      }

      // 🔤 SORT
      if (this.sorter) {
        arr.sort((a, b) => this.sorter.compare(a.name, b.name));
      } else {
        arr.sort((a, b) => (a.name > b.name ? 1 : -1));
      }

      this.data = arr;
      this._map = map;

      return this.data;
    }

    get(alias) {
      return hasMap ? this._map.get(alias) : this._map[alias] || null;
    }

    all() {
      return this.data;
    }

    search(q) {
      if (!q) return this.data;
      q = q.toLowerCase();

      return this.data.filter(g =>
        g.alias.includes(q) || g.name.toLowerCase().includes(q)
      );
    }

    random(n = 1) {
      if (!this.data.length) return null;

      const shuffled = this.data.slice();

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = tmp;
      }

      return n === 1 ? shuffled[0] : shuffled.slice(0, n);
    }

    toggleFav(alias) {
      const g = this.get(alias);
      if (!g) return;

      if (this._hasFav(alias)) this._deleteFav(alias);
      else this._addFav(alias);

      g.isFav = this._hasFav(alias);

      localStorage.setItem("hrn_f", JSON.stringify(this._favArray()));

      return g.isFav;
    }

    getFavs() {
      return this.data.filter(g => g.isFav);
    }

    logHistory(alias) {
      this.history = [alias]
        .concat(this.history.filter(a => a !== alias))
        .slice(0, 30);

      localStorage.setItem("hrn_h", JSON.stringify(this.history));
    }

    getHistory() {
      return this.history.map(a => this.get(a)).filter(Boolean);
    }

    // 💾 STORAGE HELPERS

    _initStorage(key, asSet) {
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];

        if (asSet) {
          if (hasSet) return new Set(parsed);
          return parsed;
        }

        return parsed;
      } catch {
        return asSet ? (hasSet ? new Set() : []) : [];
      }
    }

    _hasFav(a) {
      return hasSet ? this.favs.has(a) : this.favs.includes(a);
    }

    _addFav(a) {
      if (hasSet) this.favs.add(a);
      else if (!this.favs.includes(a)) this.favs.push(a);
    }

    _deleteFav(a) {
      if (hasSet) this.favs.delete(a);
      else this.favs = this.favs.filter(x => x !== a);
    }

    _favArray() {
      return hasSet ? Array.from(this.favs) : this.favs;
    }

  })();

})();
