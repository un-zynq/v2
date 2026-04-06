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

    // flatten alles naar 1 lijst
    const games = [];

    const groups = json[0]; // g1 - g5

    for (const groupName in groups) {
      const group = groups[groupName];

      for (const key in group) {
        const game = group[key];

        games.push({
          name: game.name,
          alias: game.alias,
          group: groupName,
          splash: `${this.cdn}/${groupName}/${game.alias}.webp`
        });
      }
    }

    this.cache = games;
    return games;
  }

  async getGames() {
    return await this._fetchData();
  }

  async getGame(alias) {
    const games = await this._fetchData();
    return games.find(g => g.alias === alias);
  }

  async search(query) {
    const games = await this._fetchData();
    return games.filter(g =>
      g.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getByGroup(group) {
    const games = await this._fetchData();
    return games.filter(g => g.group === group);
  }
}
