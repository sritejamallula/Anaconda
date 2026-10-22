# Anaconda: Amazon River Apex 🐍🌿

![Anaconda 3D Banner](assets/art/anaconda_model.jpg)

[![WebGL 3D](https://img.shields.io/badge/WebGL-3D%20Engine-brightgreen.svg)](https://threejs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r128-black.svg)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Desktop%20%7C%20Mobile-blue.svg)](#)

> An immersive, real-time 3D survival simulator where you control a massive green anaconda (*Eunectes murinus*) stalking the waterways, flooded forests, and riverbanks of the Amazon basin.

🎮 **[Play Live in Browser](https://sritejamallula.github.io/anaconda-amazon-survival/)** *(or [vishnuvamsi123.github.io/anaconda-amazon-survival](https://vishnuvamsi123.github.io/anaconda-amazon-survival/))*

---

## 🌟 Key Features

### 1. Procedural 3D Serpentine Inverse Kinematics
- **Multi-Joint Skeletal Solver**: 32-segment real-time continuous spine solver that realistically undulates across mudbanks, slips through root labyrinths, and dives through deep water channels.
- **Dynamic Scale Procedural Shading**: Olive-green dorsal pigmentation with authentic black oval rosettes and an articulated jaw rig capable of high mandibular expansion.

### 2. Anatomical Swallowing & Digestion Bulge
- **Traveling Vertex Deformation**: When prey is ingested, an anatomical expansion bulge forms behind the head and smoothly travels down the body segments over time.
- **Growth & Satiety**: Feeding restores satiety, increases body length (up to 15+ meters), broadens girth, and increases your apex rank while adding realistic sluggishness during heavy digestion.

### 3. Living Amazon Ecosystem
- **Amazon River Tree Frog (*Osteocephalus taurinus*)**: Agile amphibians hopping along lily pads and logs (Quick strike target).
- **Forest Spiny Rat (*Proechimys guyannensis*)**: Scurrying bank forager.
- **Capybara (*Hydrochoerus hydrochaeris*)**: Large semi-aquatic prey that grazes near shorelines and dives into the river to escape.
- **Spectacled Caiman (*Caiman crocodilus*)**: Dangerous armored predator patrolling shallow channels.
- **Titan Black Caiman Boss (*Melanosuchus niger*)**: Prehistoric 12-meter apex boss lurking in deep river corridors with a devastating lunge bite and counter-attack.

### 4. Tactical Bio-Radar HUD & Thermal Pit Vision
- **Jacobson's Organ / Thermal Mode (`T` key)**: Toggles infrared thermoregulation view, rendering water in cool indigo/cyan while highlighting warm-blooded prey in radiant incandescent heat signatures.
- **Holographic Bio-Radar**: Real-time circular minimap with river depth contours, orientation heading, and live distance pings for prey, predators, and bosses.

### 5. Zero-Dependency Web Audio Synthesizer
- Built-in procedural sound engine utilizing the Web Audio API—generates ambient nocturnal jungle crickets, river wash, slithering friction, striking whooshes, bone snaps, and throat gulping without requiring external sound files.

---

## 🕹️ Controls Guide

| Action | Desktop Keyboard / Mouse | Mobile Touch |
| :--- | :--- | :--- |
| **Move / Slither** | `W` / `S` or `↑` / `↓` | Virtual Joystick (Up/Down) |
| **Steer Heading** | `A` / `D` or `←` / `→` (or Mouse position) | Virtual Joystick (Left/Right) |
| **Sprint Burst** | `Shift` (Uses Stamina) | Joystick Outer Ring Drag |
| **Strike / Bite** | `Spacebar` or `Left Mouse Click` | `STRIKE` Button |
| **Thermal Pit Vision** | `T` Key | `HEAT` Button |
| **Cycle Camera** | `C` Key (Chase, Isometric, 1st-Person) | `[C] CAMERA` HUD Button |
| **Mute Audio** | `M` Key | `[M] AUDIO` HUD Button |
| **Pause Game** | `P` Key | — |

---

## 📸 Visual Concept Art & Level Architecture

| Anaconda 3D Character | Level 1: Marajó Island Outpost |
| :---: | :---: |
| ![Anaconda Model](assets/art/anaconda_model.jpg) | ![Marajó Island](assets/art/marajo_island.jpg) |

| Level 2: Tapajós River Crossing | Fauna Roster |
| :---: | :---: |
| ![Tapajós Crossing](assets/art/tapajos_basin.jpg) | ![Prey Fauna](assets/art/prey_fauna.jpg) |

| Swallowing Bulge Map | Tactical Radar HUD |
| :---: | :---: |
| ![Bulge Texture](assets/art/swallowing_bulge.jpg) | ![Tactical Radar](assets/art/tactical_hud.jpg) |

| Titan Black Caiman Boss | Level 3: Flooded Forest |
| :---: | :---: |
| ![Black Caiman](assets/art/black_caiman_boss.jpg) | ![Flooded Forest](assets/art/flooded_forest.jpg) |

| Thermal Pit Vision HUD | Dynamic Constriction Scene |
| :---: | :---: |
| ![Thermal Vision](assets/art/thermal_pit_vision.jpg) | ![Constriction Cinematic](assets/art/constriction_cinematic.jpg) |

---

## 🚀 Running Locally

Because the game is completely self-contained with vendored Three.js and procedural Web Audio, you can run it with any local static HTTP server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js npx
npx serve .
```

Open your browser to `http://localhost:8000` to play!

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
