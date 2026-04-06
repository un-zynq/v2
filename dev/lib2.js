export class HRN {
  constructor() {
    this.url = "https://un-zynq.github.io/games2.json";
    this.cdn = "https://cdn.jsdelivr.net/gh/un-zynq/splash-images";
    this.cache = null;
  }

  async _fetchData() {
    if (this.cache) return this.cache;

    const res = await fetch(this.url);
    const json = await res.json();

    const games = [];

    // 🔥 FIX: pak ALLE groepen (g1–g5)
    json.forEach(entry => {
      for (const group in entry) {
        const groupData = entry[group];

        for (const key in groupData) {
          const game = groupData[key];

          games.push({
            name: game.name,
            alias: game.alias,
            group: group,
            splash: `${this.cdn}/${group}/${game.alias}.webp`
          });
        }
      }
    });

    this.cache = games;
    return games;
  }

  async getGames() {
    return await this._fetchData();
  }

  async getGame(alias) {
    const games = await this._fetchData();
    return games.find(g => g.alias === alias) || null;
  }

  async getByGroup(group) {
    const games = await this._fetchData();
    return games.filter(g => g.group === group);
  }

  async search(query) {
    const games = await this._fetchData();
    return games.filter(g =>
      g.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getRandomGame() {
    const games = await this._fetchData();
    return games[Math.floor(Math.random() * games.length)];
  }
}
