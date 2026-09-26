import * as THREE from 'three';

const container = document.getElementById('game-container');
const catHpEl = document.getElementById('cat-hp');
const dogHpEl = document.getElementById('dog-hp');
const windTxtEl = document.getElementById('wind-txt');
const quizBox = document.getElementById('quiz-box');
const powerMeter = document.getElementById('power-meter');
const powerFill = document.getElementById('power-fill');

// --- Procedural Sound Effects (Web Audio API) ---
class AudioController {
  constructor() { this.ctx = null; }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }
  playTone(freq, type, duration, endFreq = null) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
  sfxThrow() { this.playTone(380, 'sine', 0.28, 90); }
  sfxHit() { this.playTone(160, 'sawtooth', 0.35, 30); }
  sfxCorrect() {
    this.playTone(520, 'triangle', 0.12);
    setTimeout(() => this.playTone(680, 'triangle', 0.2), 100);
  }
  sfxWrong() { this.playTone(200, 'square', 0.25, 90); }
}

const audio = new AudioController();

// --- 1. Scene, Camera & Renderer ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x76b6e4);
scene.fog = new THREE.Fog(0x76b6e4, 25, 60);

const camera = new THREE.PerspectiveCamera(45, 1024 / 576, 0.1, 100);
camera.position.set(0, 5, 18);
camera.lookAt(0, 1.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(1024, 576);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

// --- 2. Realistic Cartoon Lighting ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff4e6, 2.0);
sunLight.position.set(10, 18, 12);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 40;
sunLight.shadow.camera.left = -15;
sunLight.shadow.camera.right = 15;
sunLight.shadow.camera.top = 15;
sunLight.shadow.camera.bottom = -15;
sunLight.shadow.bias = -0.001;
scene.add(sunLight);

// --- 3. 3D Environment (Alley vs Backyard) ---
// Floor
const alleyGeo = new THREE.PlaneGeometry(16, 20);
const alleyMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, roughness: 0.8 });
const alleyFloor = new THREE.Mesh(alleyGeo, alleyMat);
alleyFloor.rotation.x = -Math.PI / 2;
alleyFloor.position.set(-8, 0, 0);
alleyFloor.receiveShadow = true;
scene.add(alleyFloor);

const yardGeo = new THREE.PlaneGeometry(16, 20);
const yardMat = new THREE.MeshStandardMaterial({ color: 0x66bb6a, roughness: 0.6 });
const yardFloor = new THREE.Mesh(yardGeo, yardMat);
yardFloor.rotation.x = -Math.PI / 2;
yardFloor.position.set(8, 0, 0);
yardFloor.receiveShadow = true;
scene.add(yardFloor);

// Left Alley Brick Wall (Purple Tint)
const wallGeo = new THREE.BoxGeometry(0.5, 10, 20);
const wallMat = new THREE.MeshStandardMaterial({ color: 0xab47bc, roughness: 0.9 });
const alleyWall = new THREE.Mesh(wallGeo, wallMat);
alleyWall.position.set(-15, 5, 0);
alleyWall.receiveShadow = true;
scene.add(alleyWall);

// Wooden Fence in Center
const fenceGroup = new THREE.Group();
const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.7 });
for (let i = -2; i <= 2; i++) {
  const plank = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.2, 0.1), woodMat);
  plank.position.set(0, 1.6, i * 0.4);
  plank.castShadow = true;
  plank.receiveShadow = true;
  fenceGroup.add(plank);
}
const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.6, 0.45), new THREE.MeshStandardMaterial({ color: 0xffb74d }));
post.position.set(0, 1.8, 1.2);
post.castShadow = true;
fenceGroup.add(post);
scene.add(fenceGroup);

// --- 4. 3D Stylized Characters ---
// Cat (Left)
const catGroup = new THREE.Group();
const catBodyMat = new THREE.MeshStandardMaterial({ color: 0x26a69a, roughness: 0.5 });
const catBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.4, 16), catBodyMat);
catBody.position.y = 0.7;
catBody.castShadow = true;
catGroup.add(catBody);

const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 16), catBodyMat);
catHead.position.y = 1.7;
catHead.castShadow = true;
catGroup.add(catHead);

// Trash Can for Cat
const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.65, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0x78909c, metalness: 0.3 }));
bin.position.set(-8, 0.7, 0);
bin.castShadow = true;
bin.receiveShadow = true;
scene.add(bin);

catGroup.position.set(-8, 1.4, 0);
scene.add(catGroup);

// Dog (Right)
const dogGroup = new THREE.Group();
const dogMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.6 });
const dogBody = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), dogMat);
dogBody.position.y = 0.9;
dogBody.scale.set(1, 1.1, 1);
dogBody.castShadow = true;
dogGroup.add(dogBody);

const dogHead = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), dogMat);
dogHead.position.set(0, 1.8, 0);
dogHead.castShadow = true;
dogGroup.add(dogHead);

dogGroup.position.set(8, 0, 0);
scene.add(dogGroup);

// --- 5. Game Logic & ESL System ---
let catHp = 100;
let dogHp = 100;
let wind = 0;
let turn = 'CAT';
let isCharging = false;
let chargePower = 0;
let projectile = null;
let canThrow = false;

const questions = [
  { q: "Yesterday the dog ____ a big bone.", opts: ["ATE", "EATING", "EATS"], ans: "ATE" },
  { q: "The cat is sitting ____ the bin.", opts: ["ON", "INTO", "UNDER"], ans: "ON" },
  { q: "What stands between the yards?", opts: ["FENCE", "RIVER", "TRAIN"], ans: "FENCE" },
  { q: "The dog is sleeping ____ the tree.", opts: ["UNDER", "ABOVE", "THROUGH"], ans: "UNDER" },
  { q: "The bone is ____ the food bowl.", opts: ["IN", "BETWEEN", "AMONG"], ans: "IN" }
];

function updateWind() {
  wind = parseFloat((Math.random() * 8 - 4).toFixed(1));
  if (windTxtEl) {
    windTxtEl.innerText = `WIND: ${wind > 0 ? '▶ ' : '◀ '} ${Math.abs(wind)}`;
  }
}

function promptQuestion() {
  canThrow = false;
  const item = questions[Math.floor(Math.random() * questions.length)];
  if (quizBox) {
    quizBox.innerHTML = `
      <h3>${item.q}</h3>
      <div class="quiz-options">
        ${item.opts.map(opt => `<button class="quiz-btn" onclick="window.checkAnswer('${opt}', '${item.ans}')">${opt}</button>`).join('')}
      </div>
    `;
    quizBox.style.display = 'block';
  }
}

window.checkAnswer = (selected, correct) => {
  if (selected === correct) {
    audio.sfxCorrect();
    if (quizBox) quizBox.style.display = 'none';
    canThrow = true;
  } else {
    audio.sfxWrong();
    if (quizBox) {
      quizBox.style.transform = 'translate(-46%, -50%)';
      setTimeout(() => quizBox.style.transform = 'translate(-50%, -50%)', 100);
    }
  }
};

// Input Handling
window.addEventListener('mousedown', (e) => {
  if (e.target && typeof e.target.closest === 'function' && e.target.closest('#quiz-box')) return;
  if (!canThrow || turn !== 'CAT' || projectile) return;
  isCharging = true;
  chargePower = 0;
  if (powerMeter) powerMeter.style.display = 'block';
});

window.addEventListener('mouseup', () => {
  if (isCharging) {
    isCharging = false;
    if (powerMeter) powerMeter.style.display = 'none';
    audio.sfxThrow();
    fireProjectile(chargePower);
  }
});

function fireProjectile(power) {
  canThrow = false;
  const geo = new THREE.DodecahedronGeometry(0.25);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  projectile = new THREE.Mesh(geo, mat);
  projectile.castShadow = true;

  if (turn === 'CAT') {
    projectile.position.set(-7.5, 2.8, 0);
    const speed = 7 + (power * 0.12);
    projectile.userData = {
      vx: speed * 0.7 + (wind * 0.2),
      vy: speed * 0.8,
      vz: 0
    };
  } else {
    projectile.position.set(7.5, 2.5, 0);
    const speed = 7 + (power * 0.12);
    projectile.userData = {
      vx: -speed * 0.7 + (wind * 0.2),
      vy: speed * 0.8,
      vz: 0
    };
  }
  scene.add(projectile);
}

function restartGame() {
  catHp = 100;
  dogHp = 100;
  if (catHpEl) catHpEl.style.width = '100%';
  if (dogHpEl) dogHpEl.style.width = '100%';
  turn = 'CAT';
  canThrow = false;
  isCharging = false;
  if (projectile) {
    scene.remove(projectile);
    projectile.geometry.dispose();
    projectile = null;
  }
  updateWind();
  promptQuestion();
}
window.restartGame = restartGame;

function endTurn() {
  if (projectile) {
    scene.remove(projectile);
    projectile.geometry.dispose();
    projectile = null;
  }

  if (catHp <= 0 || dogHp <= 0) {
    const winner = catHp <= 0 ? 'DOG' : 'CAT';
    if (quizBox) {
      quizBox.innerHTML = `
        <h3 style="color: ${winner === 'CAT' ? '#2e7d32' : '#c62828'};">🎉 ${winner} WINS! 🎉</h3>
        <p style="margin: 12px 0; color: #555; font-size: 15px;">Great battle! Practice makes perfect.</p>
        <button class="quiz-btn" onclick="window.restartGame()">PLAY AGAIN</button>
      `;
      quizBox.style.display = 'block';
    }
    return;
  }

  turn = turn === 'CAT' ? 'DOG' : 'CAT';
  updateWind();
  if (turn === 'CAT') {
    promptQuestion();
  } else {
    setTimeout(dogAITurn, 1200);
  }
}

function dogAITurn() {
  const estimatedPower = Math.min(Math.max(48 - (wind * 3) + (Math.random() * 8 - 4), 20), 90);
  audio.sfxThrow();
  fireProjectile(estimatedPower);
}

// --- 6. Main Loop ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Subtle breathing idle animations
  catGroup.scale.y = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.03;
  dogGroup.scale.y = 1 + Math.sin(clock.getElapsedTime() * 3.5) * 0.03;

  if (isCharging && chargePower < 100) {
    chargePower += 1.8;
    if (powerFill) powerFill.style.width = `${chargePower}%`;
  }

  // 3D Physics update for projectile
  if (projectile) {
    projectile.userData.vy -= 9.8 * delta; // Gravity
    projectile.userData.vx += wind * 0.3 * delta; // Wind
    projectile.position.x += projectile.userData.vx * delta;
    projectile.position.y += projectile.userData.vy * delta;
    projectile.rotation.x += 6 * delta;

    const dogCenter = new THREE.Vector3(8, 1.2, 0);
    const catCenter = new THREE.Vector3(-8, 2.2, 0);

    // Hit Ground
    if (projectile.position.y <= 0.2) {
      audio.sfxHit();
      endTurn();
    }
    // Hit Center Fence
    else if (Math.abs(projectile.position.x) < 0.35 && projectile.position.y < 3.2) {
      audio.sfxHit();
      endTurn();
    }
    // Cat hits Dog
    else if (turn === 'CAT' && projectile.position.distanceTo(dogCenter) < 1.6) {
      audio.sfxHit();
      dogHp = Math.max(0, dogHp - 25);
      if (dogHpEl) dogHpEl.style.width = `${dogHp}%`;
      endTurn();
    }
    // Dog hits Cat
    else if (turn === 'DOG' && projectile.position.distanceTo(catCenter) < 1.6) {
      audio.sfxHit();
      catHp = Math.max(0, catHp - 25);
      if (catHpEl) catHpEl.style.width = `${catHp}%`;
      endTurn();
    }
  }

  renderer.render(scene, camera);
}

// Global debug exposure
window.threeGame = {
  scene,
  camera,
  renderer,
  get catHp() { return catHp; },
  get dogHp() { return dogHp; },
  get wind() { return wind; },
  get turn() { return turn; },
  get canThrow() { return canThrow; },
  get isCharging() { return isCharging; },
  get projectile() { return projectile; },
  fireProjectile,
  promptQuestion
};

updateWind();
promptQuestion();
animate();
