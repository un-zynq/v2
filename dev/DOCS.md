# HRN Core Documentation v7.5.16

Modern, lightweight game library loader and device detection utility.

---

## Installation

### Standard Script
```html
<script src="https://cdn.jsdelivr.net/gh/un-zynq/v2/dev/lib7.5.16.min.js"></script>
```

### ES Module
```javascript
import 'https://cdn.jsdelivr.net/gh/un-zynq/v2/dev/lib7.5.16.min.js';
```

---

## Initialization

The library must be initialized asynchronously to fetch the database.

```javascript
await HRN.init({
  mode: 'all',       // 'all', 'supported', 'favs'
  sort: 'name',      // 'name', 'category', 'alias'
  search: '',        // Initial search query
  src: undefined,    // Custom JSON source URL
  cdn: undefined     // Custom Thumbnail CDN URL
});
```

---

## Core API

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `HRN.list` | `Array` | Returns the current filtered and sorted game list. |
| `HRN.deviceType` | `Number` | 1: Desktop (Touch), 2: Desktop (Mouse), 3: Mobile, 4: Tablet. |

### Methods
| Method | Description |
| :--- | :--- |
| `search(query)` | Filters the list by name or alias. |
| `filterSupported()` | Filters list to only show games compatible with current device. |
| `filterFavorites()` | Filters list to only show favorited games. |
| `toggleFavorite(alias)`| Adds or removes a game from favorites (saves to LocalStorage). |
| `isFavorite(alias)` | Returns `true` if the game is in favorites. |
| `reset()` | Clears all filters and restores the full list. |

---

## Data Structure

Each object in `HRN.list` contains:

```javascript
{
  name: "Game Name",
  category: "Action",
  alias: "game-id",
  url: "path/game-id",
  thumb: "cdn/path/game-id.webp",
  isSupported: true,
  isFavorite: false
}
```

---

## Usage Example

```javascript
async function loadGames() {
  await HRN.init();
  
  const games = HRN.search('mario').filterSupported().list;
  
  games.forEach(game => {
    console.log(`Title: ${game.name}, URL: ${game.url}`);
  });
}
```
