# 🎮 Monster Word Battle

> A polished premium **2D Cartoon Action-Adventure & ESL Learning Game** built with **Phaser 3** and **Vite** for young learners (ages 6–10).

Inspired by classic 2-player turn-based artillery games, **Monster Word Battle** seamlessly merges picture-based educational challenges with responsive arcade combat physics.

---

## 🌟 Gameplay Loop

```
EXPLORE & FACE OFF
        ↓
VISUAL ESL CHALLENGE EVENT (Floating In-World Plaque)
        ↓
CHOOSE ILLUSTRATED ANSWER (IN / ON / UNDER)
        ↓
CONFETTI & BATTLE REWARD (🔥 Fireball / 💚 Heal / 🪨 Rock)
        ↓
AIM & POWER (Angle Arc + Dynamic Trajectory Preview)
        ↓
SQUASH & STRETCH THROW
        ↓
PROJECTILE FLIGHT (Wind Physics & Gravity)
        ↓
COMIC IMPACT EXPLOSION & KNOCKBACK
        ↓
OPPONENT TURN & NEXT CHALLENGE
```

---

## 🚀 Key Features

### 1. Expressive Original Monster Characters
- **Hierarchical Modular Rigs**: Torso, belly patch, articulated limbs, horns, and feet with toes.
- **Continuous Living Movement**: Subtle sine-wave breathing bobbing and an independent randomized eye-blinking timer (every 2.5–4.5s).
- **Interactive Animations**:
  - **Aim Preparation**: Leans forward toward the opponent, raising the throwing arm with the equipped weapon held in hand.
  - **3-Stage Squash & Stretch Throw**: Anticipation lean back $\to$ thrust snap forward with trajectory release $\to$ follow-through recoil.
  - **Hurt Reaction**: Comic dizzy `X X` eyes, red hit flash, $+35\text{px}$ elastic knockback bounce, and floating bold damage numbers.
  - **Heal Reaction**: Joyful upward hop with radiant green healing crosses, floating heart bubbles, and smooth HP bar restoration.
  - **Victory**: Celebratory jumping with arms raised and starburst particles.

### 2. Multi-Layer Parallax Adventure World
- **Layer 0**: Radiant cartoon sky with warm sunlight and volumetric horizon glow.
- **Layer 1**: Distant majestic mountain peaks with snow caps and purple atmospheric haze.
- **Layer 2**: Rolling green hills with storybook fairytale cottage houses and an animated windmill.
- **Layer 3**: Drifting fluffy cartoon clouds moving at layered velocities.
- **Layer 4**: Deep center canyon with flowing multi-layered animated river water, glistening wave ripples, stepping stones, and wooden crates.
- **Layer 5**: Rickety wooden rope suspension bridge spanning across the canyon with an animated observer kitten watching the battle.
- **Layer 6**: Left and right carved stone masonry cliff platforms with overhanging lush grass and wildflowers.
- **Layer 7**: Foreground foliage with grass blades and wildflowers that gently sway in the wind for cinematic depth of field.
- **Ambient Life**: Floating ambient golden sparkles and pollen drifting across the scene.

### 3. In-Game Educational Challenge Event
- **Floating In-World Plaque (`y: 195`)**: Positioned in the upper center, keeping the **entire arena, monsters, bridge, and river 100% visible** during questions.
- **Illustrated Mini-Scenes**:
  - **IN**: Cute tabby kitten peeking out from inside an open cardboard box with folded flaps and paws resting on the rim.
  - **ON**: Tabby cat proudly perched on top of a detailed wooden crate with curled tail.
  - **UNDER**: Kitten sheltered underneath a propped wooden box, peeking out with wide inquisitive eyes.
- **Tactile Feedback**:
  - Incorrect answers trigger a gentle card wobble and boing tone with **immediate retry** (the turn is never lost).
  - Correct answers trigger a **multi-color confetti explosion shower**, an emerald checkmark badge, and immediate weapon equip in the monster's hand.

### 4. Learning-Driven Battle Rewards
- **🔥 Fireball ($\times 1.5$ Power, 35 Damage)**: Unlocked by correct preposition challenges. Spins in flight with a starburst flame core, trailing orange ember particles, and causes a large comic starburst explosion on impact.
- **💚 Heal ($+30$ HP Recovery)**: Unlocked by streak performance. Restores $+30$ HP with green cross sparkles, heart bubbles, and animated health bar refill.
- **🪨 Normal Rock (20 Damage)**: Default fallback weapon with dust puff motion trail.

### 5. Modern Mobile-Arcade Combat UI
- **Player Status Cards**: Golden beveled avatar frames, 3-heart indicators (`❤️❤️❤️`), glossy animated HP bars, and collectible ability badges (`[🔥 FIRE] [🛡️ SHIELD] [💚 HEAL] [🪨 ROCK]`).
- **Metallic Wind Compass**: Central wind gauge with directional arrow and force readout (`💨 WIND ➔ 8`).
- **Tactile Control Deck**: Slate-and-gold arcade tray with circular angle increment buttons, glowing power slider, and dynamic action button that adapts to the active ability (`🔥 THROW!`, `💚 HEAL!`, `🪨 THROW!`).

### 6. Procedural Audio Synthesizer
- Built using the native **Web Audio API** with zero external audio file dependencies.
- Generates tactile UI clicks, cartoon throw whooshes, fiery fireball whooshes, healing chimes, correct answer fanfare, comic wrong boings, explosion blasts, and victory fanfare.

---

## 📁 Modular Asset Architecture

All artwork is structured as high-definition, modular vector SVGs inside `public/assets/`, ready for drop-in replacement by any artist:

```
public/assets/
├── characters/
│   ├── blue_monster/        # body, belly, eye_open, eye_blink, eye_hurt, mouth_smile, mouth_hurt, arm, foot
│   └── red_monster/         # body, belly, eye_open, eye_blink, eye_hurt, mouth, arm, foot
├── environments/            # bg_sky, bg_mountains, bg_hills_village, cliff_left, cliff_right, river_water, rope_bridge, wooden_crate, observer_cat, foreground_plants
├── projectiles/             # proj_rock, proj_fireball, flame_particle
├── effects/                 # impact_explosion, heal_cross, heart_particle, confetti
└── ui/                      # avatar_frame, hp_bar_frame, ability cards (fire/heal/shield/rock), wind_gauge_badge, challenge_scroll, mini-scenes (in/on/under)
```

---

## 🛠️ Tech Stack

- **Game Engine**: [Phaser 3](https://phaser.io/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Language**: Vanilla JavaScript (ES6+ Modules)
- **Audio**: Web Audio API (Synthesized procedural SFX)
- **Assets**: Modular Vector SVGs

---

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/maysaaaam-rgb/Monster-Word-Battle.git
cd Monster-Word-Battle

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser at `http://localhost:3000/`.

### Production Build
```bash
npm run build
```
The optimized production bundle will be generated in the `dist/` directory.

---

## 📄 License
MIT License.
