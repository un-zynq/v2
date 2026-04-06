(function (root, factory) {
    if (typeof define === 'function' && define.amd) define([], factory);
    else if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.HRN = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class HRN {
        constructor() {
            this.config = {
                src: "https://un-zynq.github.io/games2.json",
                cdn: "https://cdn.jsdelivr.net/gh/un-zynq/splash-images"
            };

            this.data = [];
            this._map = new Map();
            this.favs = this._initStorage('hrn_f', true);
            this.history = this._initStorage('hrn_h', false);
            
            this.isModern = typeof Map !== 'undefined' && typeof Intl !== 'undefined';
            this.sorter = this.isModern ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }) : null;
        }

        async load() {
            const useCache = typeof window !== 'undefined' && !!window.caches;
            
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
                return [];
            }
        }

        async _fetchAndCache(storage) {
            const res = await fetch(this.config.src);
            const json = await res.json();
            this._parse(json);
            if (storage) storage.put(this.config.src, new Response(JSON.stringify(json)));
            return this.data;
        }

        async _fetchStandard() {
            if (typeof fetch === 'function') {
                const r = await fetch(this.config.src);
                const j = await r.json();
                return this._parse(j);
            }
            return new Promise((res) => this._loadXHR(res));
        }

        _parse(j) {
            if (!Array.isArray(j)) return this.data;

            const list = [];
            const map = this.isModern ? new Map() : {};

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
                            isFav: this.isModern ? this.favs.has(key) : (this.favs.indexOf(key) !== -1)
                        };
                        
                        list.push(game);
                        if (this.isModern) map.set(key, game); else map[key] = game;
                    }
                }
            }

            this.data = list.sort((a, b) => 
                this.isModern ? this.sorter.compare(a.name, b.name) : a.name.localeCompare(b.name)
            );

            this._map = map;
            return this.data;
        }

        get(alias) {
            if (!alias) return null;
            return this.isModern ? this._map.get(alias) : this._map[alias] || null;
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
            const d = this.data;
            if (d.length === 0) return null;
            if (n === 1) return d[(Math.random() * d.length) | 0];
            return [...d].sort(() => 0.5 - Math.random()).slice(0, n);
        }

        toggleFav(alias) {
            const g = this.get(alias);
            if (!g) return;

            if (this.isModern) {
                this.favs.has(alias) ? this.favs.delete(alias) : this.favs.add(alias);
                g.isFav = this.favs.has(alias);
                this._sync('hrn_f', Array.from(this.favs));
            } else {
                const i = this.favs.indexOf(alias);
                if (i === -1) this.favs.push(alias); else this.favs.splice(i, 1);
                g.isFav = i === -1;
                this._sync('hrn_f', this.favs);
            }
            return g.isFav;
        }

        getFavs() {
            return this.data.filter(g => g.isFav);
        }

        logHistory(alias) {
            this.history = [alias, ...this.history.filter(x => x !== alias)].slice(0, 30);
            this._sync('hrn_h', this.history);
        }

        getHistory() {
            return this.history.map(a => this.get(a)).filter(Boolean);
        }

        _initStorage(key, asSet) {
            try {
                const s = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
                const d = s ? JSON.parse(s) : [];
                return (asSet && this.isModern) ? new Set(d) : d;
            } catch (e) {
                return asSet ? new Set() : [];
            }
        }

        _sync(key, val) {
            try { 
                if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(val)); 
            } catch (e) {}
        }

        _loadXHR(res) {
            if (typeof XMLHttpRequest === 'undefined') return res([]);
            const x = new XMLHttpRequest();
            x.open("GET", this.config.src, true);
            x.onload = () => {
                try { res(this._parse(JSON.parse(x.responseText))); } 
                catch (e) { res([]); }
            };
            x.onerror = () => res([]);
            x.send();
        }
    }

    return new HRN();
}));
