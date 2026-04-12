# Installation

## Script Tag

```html id="i1"
<script src="https://cdn.jsdelivr.net/gh/un-zynq/zynq-lib@1.0.8/index.min.js"></script>
```

## ES Module

```javascript id="i2"
import ZYNQ, { games, peer } from "https://cdn.jsdelivr.net/gh/un-zynq/zynq-lib@1.0.8/index.min.js"
```

---

# ZYNQ.games

Game discovery, filtering, sorting and state management.

---

## Game Object (Runtime)

A game object returned by `ZYNQ.games` methods.

```text id="g1"
Game:
- name: string
- category: string (optional)
- alias: string
- url: string
- thumb: string

- devices: Array<number> (optional / may be empty)

Computed:
- isSupported: boolean (getter)
- isFavorite: boolean (getter)
```

---

## Important Notes

* `devices` is **not guaranteed to be filled**

  * may be `[]`
  * may be partially missing depending on dataset
* `isSupported` is computed dynamically from device + environment
* `isFavorite` is computed from local storage state

---

## Properties

### `.list`

Filtered array of games

```javascript id="p1"
ZYNQ.games.list
```

---

### `.total`

Total loaded games

```javascript id="p2"
ZYNQ.games.total
```

---

### `.filteredCount`

Number of visible games

```javascript id="p3"
ZYNQ.games.filteredCount
```

---

### `.history`

Recently played game aliases

```javascript id="p4"
ZYNQ.games.history
```

---

### `.favorites`

Favorite game aliases

```javascript id="p5"
ZYNQ.games.favorites
```

---

## Methods

---

### `.init(options)`

Initialize game system.

```text id="m1"
options:
- mode: "all" | "supported" | "favs"
- search: string (optional)
- sort: string (optional)
- src: string (optional) → game JSON source (defaults to ZYNQ internal dataset)
- cdn: string (optional) → thumbnail base URL (defaults to ZYNQ CDN)
```

👉 If omitted, ZYNQ automatically uses built-in defaults.

```javascript id="m1e"
await ZYNQ.games.init()
```

---

### `.search(query)`

Search games by name or alias

```javascript id="m2"
ZYNQ.games.search("alien")
```

---

### `.random(n)`

Get random games

```javascript id="m3"
ZYNQ.games.random(2)
```

---

### `.getRandomOne()`

Get a single random game

```javascript id="m4"
ZYNQ.games.getRandomOne()
```

---

### `.shuffle()`

Shuffle current list

```javascript id="m5"
ZYNQ.games.shuffle()
```

---

### `.sortBy(field)`

Sort by field

```javascript id="m6"
ZYNQ.games.sortBy("name")
```

---

### `.sortByPopularity()`

Sort by popularity

```javascript id="m7"
ZYNQ.games.sortByPopularity()
```

---

### `.getByAlias(alias)`

Get a single game

```javascript id="m8"
ZYNQ.games.getByAlias("alien-hominid")
```

---

### `.getByCategory(category)`

Filter by category

```javascript id="m9"
ZYNQ.games.getByCategory("shooter")
```

---

### `.filterSupported()`

Keep only supported games

```javascript id="m10"
ZYNQ.games.filterSupported()
```

---

### `.filterFavorites()`

Keep only favorites

```javascript id="m11"
ZYNQ.games.filterFavorites()
```

---

### `.toggleFavorite(alias)`

Toggle favorite state

```javascript id="m12"
ZYNQ.games.toggleFavorite("alien-hominid")
```

---

### `.isFavorite(alias)`

Check favorite state

```javascript id="m13"
ZYNQ.games.isFavorite("alien-hominid")
```

---

### `.addToHistory(alias)`

Add game to history

```javascript id="m14"
ZYNQ.games.addToHistory("alien-hominid")
```

---

### `.getHistory()`

Get history list

```javascript id="m15"
ZYNQ.games.getHistory()
```

---

### `.clearHistory()`

Clear history

```javascript id="m16"
ZYNQ.games.clearHistory()
```

---

### `.reset()`

Reset filters

```javascript id="m17"
ZYNQ.games.reset()
```

---

## Example

```javascript id="x1"
await ZYNQ.games.init()

const results = ZYNQ.games
  .search("alien")
  .filterSupported()
  .sortBy("name")
  .list

console.log(results)
```

---

# ZYNQ.peer

Realtime peer-to-peer communication system (text, audio, video)

---

## Constructor

```javascript id="c1"
new ZYNQ.peer(options)
```

---

## Options

```text id="c2"
video?: boolean
audio?: boolean
txt?: boolean
debug?: boolean
rateLimit?: number
maxMsgSize?: number
autoReconnect?: boolean
maxReconnectAttempts?: number
```

---

## Methods

### `.connect(remoteId)`

```javascript id="c3"
peer.connect("peer-id")
```

---

### `.send(data)`

```javascript id="c4"
peer.send("hello")
```

---

### `.getStream()`

```javascript id="c5"
await peer.getStream()
```

---

### `.close()`

```javascript id="c6"
peer.close()
```

---

### `.destroy()`

```javascript id="c7"
peer.destroy()
```

---

## Events

### `"open"`

```javascript id="e1"
peer.on("open", id => {})
```

---

### `"data"`

```javascript id="e2"
peer.on("data", msg => {})
```

---

### `"stream"`

```javascript id="e3"
peer.on("stream", stream => {})
```

---

### `"close"`

```javascript id="e4"
peer.on("close", () => {})
```

---

### `"error"`

```javascript id="e5"
peer.on("error", err => {})
```

---

## Example

```javascript id="x2"
const peer = new ZYNQ.peer({
  video: true,
  audio: true
})

peer.on("open", id => {
  console.log("My ID:", id)
})

peer.on("data", msg => {
  console.log(msg)
})

peer.connect("other-id")

peer.send("hello 👽")
```
