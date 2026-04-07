'use strict';

window.HRN = (function () {
    class HRN {
        constructor() {
            this.config = {
                src: "https://un-zynq.github.io/games2.json",
                cdn: "https://cdn.jsdelivr.net/gh/un-zynq/thumbnails@7aed1c0153db7a46e24f63e25f0925a99166a689"
            };

            this.data = [];
            this._map = new Map();
            this.favs = this._initStorage('hrn_f', true);
            this.history = this._initStorage('hrn_h', false);
            
            this.isModern = typeof Map !== 'undefined' && typeof Intl !== 'undefined';
            this.sorter = this.isModern ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }) : null;
        }

        async load() {
            const useCache = 'caches' in window;
            
            try {
                if (useCache) {
                    const storage = await caches.open('hrn-apex-cache');
                    const match = await storage.match(this.config.src);
                    
                    if (match) {
                        const cachedData = await match.json();
                        this._parse(cachedData);
                        this._fetchAndCache(storage).catch(() => {});
                        return this.data;
                    }
                    return await this._fetchAndCache(storage);
                }
                
                return await this._fetchStandard();
            } catch (e) {
                console.error("HRN Load Error:", e);
                return [];
            }
        }

        async _fetchAndCache(storage) {
            const res = await fetch(this.config.src);
            const json = await res.json();
            this._parse(json);
            storage.put(this.config.src, new Response(JSON.stringify(json)));
            return this.data;
        }

        async _fetchStandard() {
            const r = await fetch(this.config.src);
            const j = await r.json();
            return this._parse(j);
        }


        _parse(j) {
            if (!Array.isArray(j)) return this.data;

            const list = [];
            const map = new Map();

            for (let i = 0; i < j.length; i++) {
                const shard = j[i];
                for (const group in shard) {
                    const games = shard[group];
                    for (const key in games) {
                        const raw = games[key];
                        const { rank, ...cleanInfo } = raw;
                        const game = {
                            ...cleanInfo,
                            alias: key,
                            url: group + "/" + key,
                            splash: this.config.cdn + "/" + group + "/" + key + ".webp",
                            isFav: this.favs.has(key)
                        };
                        
                        list.push(game);
                        map.set(key, game);
                    }
                }
            }

            this.data = list.sort((a, b) => this.sorter.compare(a.name, b.name));
            this._map = map;
            return this.data;
        }


        get(alias) {
            return this._map.get(alias) || null;
        }

        all() {
            return this.data;
        }

        search(q) {
            if (!q) return this.data;
            const s = q.toLowerCase();
            return this.data.filter(g => 
                g.alias.includes(s) || g.name.toLowerCase().includes(s)
            );
        }

        random(n = 1) {
            if (this.data.length === 0) return null;
            if (n === 1) return this.data[(Math.random() * this.data.length) | 0];
            return [...this.data].sort(() => 0.5 - Math.random()).slice(0, n);
        }


        toggleFav(alias) {
            const g = this.get(alias);
            if (!g) return;

            if (this.favs.has(alias)) {
                this.favs.delete(alias);
            } else {
                this.favs.add(alias);
            }
            
            g.isFav = this.favs.has(alias);
            localStorage.setItem('hrn_f', JSON.stringify(Array.from(this.favs)));
            return g.isFav;
        }

        getFavs() {
            return this.data.filter(g => g.isFav);
        }

        logHistory(alias) {
            this.history = [alias, ...this.history.filter(x => x !== alias)].slice(0, 30);
            localStorage.setItem('hrn_h', JSON.stringify(this.history));
        }

        getHistory() {
            return this.history.map(a => this.get(a)).filter(Boolean);
        }

        _initStorage(key, asSet) {
            try {
                const s = localStorage.getItem(key);
                const d = s ? JSON.parse(s) : [];
                return asSet ? new Set(d) : d;
            } catch (e) {
                return asSet ? new Set() : [];
            }
        }
    }

    return new HRN();
})();
