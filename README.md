# ApexDeco

<p align="center">
  <img src="../images/favicon.svg" alt="ApexDeco logo" width="128" height="128">
</p>

<p align="center">
  <b>A modern, browser-based mixed-gas decompression planner</b><br>
  Bühlmann ZH-L16C with Gradient Factors · VPM-B / VPM-A / VPM-B/E / VPM-B/GFS · OC &amp; CCR
</p>

<p align="center">
  <img alt="Language" src="https://img.shields.io/badge/language-JavaScript-yellow">
  <img alt="No backend" src="https://img.shields.io/badge/runtime-browser-blue">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green">
  <img alt="Math verified" src="https://img.shields.io/badge/math-verified%20vs%20native%20reference-brightgreen">
</p>

---

## About

**ApexDeco** is an open, offline-first technical-diving decompression planner that runs
entirely in your web browser — no server, no installation, no telemetry. It produces
detailed ascent schedules for trimix, nitrox and air dives on open-circuit or closed-circuit
rebreathers, using the two most widely trusted decompression models in technical diving:
**Bühlmann ZH-L16C + Gradient Factors** and **VPM-B** (plus VPM-A, VPM-B/E, VPM-B/GFS
variants).

Every equation in this planner has been cross-verified against a well-known native
reference implementation — the Android MultiDeco engine. The regression suite
(`tests.html`) contains hundreds of numerical assertions that lock JS output to the
native reference within ±1 % on reference profiles, including a full multi-level trimix
dive (80 m / 26 min → 30 m / 30 min → 70 m / 28 min) matching to the minute.

> **This project is not affiliated with, endorsed by, or derived from the source code
> of any commercial dive-planning software. All algorithms are re-implemented from
> published scientific literature and verified numerically.**

---

## Screenshots

<p align="center">
  <em>Add screenshots to <code>docs/screenshots/</code> and reference them here.</em>
</p>

---

## Features

### Decompression models
- ✅ **Bühlmann ZH-L16C** with customizable Gradient Factors (GF Lo / GF Hi)
- ✅ **VPM-B** (Varying Permeability Model, Baker / Yount / Maiken)
- ✅ **VPM-A** (classic VPM without Boyle's-law compensation)
- ✅ **VPM-B/E** (Extended VPM-B for deep dives)
- ✅ **VPM-B/GFS** (VPM-B with Bühlmann-style gradient-factor surfacing)
- ✅ **VPM-B/FBO** (Fast Bailout with reduced Boyle's correction)
- ✅ Conservatism levels **+0 … +5** for all VPM variants

### Dive configuration
- Metric & Imperial units
- Salt water and fresh water
- Altitude diving with optional acclimatization
- Open Circuit and Closed Circuit Rebreather (CCR) with configurable setpoints
- Multi-level dives with proper inter-level deco ascents
- Multiple bottom gases and travel gases
- Unlimited deco gases with automatic switch selection
- Configurable ascent / descent / deco-ascent / surface-ascent rates
- Configurable step size, min stop time, last-stop depth (OC / CCR separately)
- Multi-dive planning with surface interval and tissue carry-over
- 2-week rolling OTU tracking

### Physiology & limits
- **CNS %** using the native-reference %/min rate table (0.50 – 2.00 bar ppO₂)
- **OTU** using the Repex formula
- **Gas density** warning (Mitchell limits)
- **Isobaric Counter-Diffusion (IBCD)** warnings for N₂ and He spikes on gas switches
- Configurable warning thresholds for ppO₂ high / low, CNS, OTU

### Output
- Detailed run-time table (descent, level, ascent, stop, surfacing) with mix, ppO₂, EAD
- Gas consumption by cylinder size and fill pressure
- Decozone start depth
- Ready-to-copy plain-text export of the full plan
- Interactive profile chart (Highcharts)

### Tools
- **Best Mix** for target depth / ppO₂
- **EAD / END / MOD** calculator
- **Nitrox blender** (partial pressure topping)
- **Trimix blender**
- **Cylinder capacity** converter
- **Top-up** calculator
- **Gas density** calculator

### Safety & plan validation
- Bailout plan generator (OC bailout from a CCR dive)
- Cave-type bailout (thirds rule)
- Automatic gas-switch validation against ppO₂ limits
- CCR diluent ppO₂ check
- Extended-stop mode for additional conservatism

---

## Decompression math — verification

| Reference profile | Native runtime | ApexDeco runtime | Δ |
|---|---:|---:|---:|
| 80 m / 26 min → 30 m / 30 min → 70 m / 28 min, air, VPM-B +2 | 333 min | 333 min | **0 %** |
| 50 m / 30 min, EAN32, GF 30/85 | matches | matches | < 1 % |
| Various short profiles (NDL, shallow deco) | matches | matches | < 1 % |

Open `tests.html` in your browser to run the full math-verification suite.

---

## Getting started

ApexDeco is a static web app. No build step, no dependencies to install.

### Use it online
Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).

### Use it locally (recommended)
```bash
git clone https://github.com/YOUR-USER/ApexDeco.git
cd ApexDeco/release_01
# any static file server works, e.g.:
python -m http.server 8080
# then navigate to http://localhost:8080/
```

> Serving via `file://` works too, but some browsers restrict `localStorage` on that
> protocol — a local static server is recommended.

### Use it offline
Because everything runs in the browser, you can zip the `release_01/` folder and carry
it on any laptop, USB stick or tablet. No network is required at runtime.

---

## Architecture

```
release_01/
├── index.html                   # Main planner UI
├── tests.html                   # Math-verification / regression suite
├── deco-engine.js               # Bühlmann ZH-L16C + GF engine
├── vpm-engine.js                # VPM-A / VPM-B / VPM-B/E / VPM-B/GFS engine
├── app-*.js                     # UI layers (state, config, levels, result, debug, …)
├── profile-chart.js             # Highcharts profile rendering
├── tool-*.js                    # Stand-alone dive tools
└── styles.css
```

The two decompression engines are completely independent of the UI and can be embedded
in any other JS project:

```js
const settings = DecoEngine.createDefaultSettings();
settings.metric = true;
settings.gfLo = 30; settings.gfHi = 85;

const levels = [{ depth: 40, time: 25, o2: 21, he: 35 }];
const decos  = [{ o2: 50, he: 0 }, { o2: 100, he: 0 }];

// Bühlmann
const plan = DecoEngine.calculate(levels, decos, settings);

// VPM-B
settings.conservatism = 2;
const vpmPlan = VPMEngine.calculate(levels, decos, settings, 'VPMB');
```

---

## Disclaimer

> **⚠️ ApexDeco is experimental software. It is NOT a substitute for proper technical-
> diving training, a certified dive computer, or professional judgement. Decompression
> schedules produced by any software — including this one — can be wrong. Never dive a
> plan you do not understand. Always carry a backup plan and a backup computer. Always
> dive within the limits of your training, physical condition and experience.**
>
> The authors and contributors of ApexDeco accept no liability for any injury, decompression
> sickness, or loss of life resulting from the use of this software. Use entirely at your
> own risk.

---

## Contributing

Contributions are welcome — especially:
- Additional regression test cases (compare against a published reference and add the
  profile + expected numbers to `tests.html`)
- UI / UX improvements
- Translations
- Documentation and dive-theory references

Please keep the ZHL-16 engine (`deco-engine.js`) *numerically unchanged* unless you
accompany the change with regression-test evidence — the Bühlmann engine is
considered stable and is used as the baseline for cross-model validation.

---

## References

- A. A. Bühlmann — *Tauchmedizin* (Springer, 5th ed.)
- Erik C. Baker — *Clearing Up The Confusion About "Deep Stops"*
- Erik C. Baker — *Understanding M-Values*
- D. E. Yount, E. B. Maiken — *Varying Permeability Model* papers
- NOAA Diving Manual — CNS / OTU reference tables

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Dive safe. Plan your dive, dive your plan.</sub>
</p>
