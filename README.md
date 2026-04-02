# HRN | CORE Interface

A high-performance, minimalist dashboard and game hub built with a focus on aesthetics and efficiency. Powered by a custom WebGL particle engine, HRN | CORE provides a seamless, "OS-like" experience for hosting self-hosted content and unblocked games.

## ✨ Features

* **Custom WebGL Particle Engine:** High-performance background rendering using the GPU.
* **Adaptive Density:** Particle count scales dynamically based on screen resolution ($1.1$ particles per $100 \times 100\text{px}$), ensuring a consistent visual experience across all devices.
* **Ultrafast Navigation:** Pre-caches sub-pages (`settings`, `games`, `about`) to enable instant, zero-latency transitions.
* **Glassmorphic UI:** Modern aesthetic featuring real-time blurs, $900$ weight typography, and CSS variable-driven theming.
* **Responsive Logo Logic:** Intelligent tagline wrapping that prevents layout breaks on mobile devices while maintaining a clean, centered brand identity.
* **Ambient Backgrounds:** Support for custom image backgrounds with smooth CSS transitions and brightness filtering.

## 🚀 Technical Overview

### Particle Density Logic
The engine calculates the total screen area and populates it based on a specific density constant. This avoids "empty" screens on 4K monitors and "overcrowded" screens on mobile:

$$pAmount = \lfloor (\frac{width \times height}{10000}) \times density \rfloor$$

### Performance
By utilizing `requestAnimationFrame` and a dedicated Vertex/Fragment shader pipeline, the interface maintains a steady $60\text{ FPS}$ even with hundreds of active elements, leaving the CPU free to handle game logic within the iframes.

## 📂 File Structure

* `index.html`: The core interface and WebGL engine.
* `games.html`: The library for your 500+ self-hosted games.
* `settings.html`: Configuration for colors, titles, and backgrounds.
* `about.html`: Version info and credits.

## 🛠 Setup & Customization

1.  **Hosting:** Upload all files to your web server.
2.  **Games:** Add your unblocked game links or local files to `games.html`.
3.  **Theming:** Use the built-in settings to adjust the accent color. The system uses `localStorage` to persist your configuration.

### LocalStorage Keys
| Key | Description | Default |
| :--- | :--- | :--- |
| `hrn_clr` | Hex Accent Color | `#89b4fa` |
| `hrn_int` | Particle Density | `1.1` |
| `hrn_op` | UI/Particle Opacity | `0.8` |
| `hrn_title` | Browser Tab Title | `HRN \| CORE` |
