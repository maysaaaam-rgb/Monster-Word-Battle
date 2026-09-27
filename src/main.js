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

// --- 1. المشهد والكاميرا بنسب كلاسيكية مسرحية ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x82caea);

const camera = new THREE.PerspectiveCamera(38, 1024 / 576, 0.1, 100);
camera.position.set(0, 3.8, 19.5);
camera.lookAt(0, 1.4, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(1024, 576);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

// --- 2. إضاءة كرتونية نقية مع ظلال ناعمة ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x556b2f, 1.15);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff7e6, 2.0);
sun.position.set(10, 16, 14);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 40;
sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -15;
sun.shadow.bias = -0.0005;
scene.add(sun);

// --- 3. بناء البيئة الكرتونية المتطابقة مع الأصل ---
const alleyFloorMat = new THREE.MeshStandardMaterial({ color: 0x9fa8a3, roughness: 0.9 });
const grassMat = new THREE.MeshStandardMaterial({ color: 0x68b349, roughness: 0.7 });
const purpleMat = new THREE.MeshStandardMaterial({ color: 0xc196c1, roughness: 0.85 });
const woodSlatMat = new THREE.MeshStandardMaterial({ color: 0x8a7746, roughness: 0.8 });
const postYellowMat = new THREE.MeshStandardMaterial({ color: 0xf5df94, roughness: 0.7 });

// الأرضيات (أزفلت الزقاق يسار، وعشب الحديقة يمين)
const groundAlley = new THREE.Mesh(new THREE.PlaneGeometry(15, 26), alleyFloorMat);
groundAlley.rotation.x = -Math.PI / 2;
groundAlley.position.set(-7.5, 0, 0);
groundAlley.receiveShadow = true;
scene.add(groundAlley);

const groundYard = new THREE.Mesh(new THREE.PlaneGeometry(15, 26), grassMat);
groundYard.rotation.x = -Math.PI / 2;
groundYard.position.set(7.5, 0, 0);
groundYard.receiveShadow = true;
scene.add(groundYard);

// جدار الزقاق البنفسجي الممتد بنافذة رمادية كما في الأصل
const alleyWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 14, 25), purpleMat);
alleyWall.position.set(-11.8, 7, 0);
alleyWall.rotation.y = 0.12;
alleyWall.receiveShadow = true;
scene.add(alleyWall);

const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 2.2), new THREE.MeshStandardMaterial({ color: 0x4a3b4a }));
winFrame.position.set(-11.3, 7.8, -2);
winFrame.rotation.y = 0.12;
scene.add(winFrame);

const winGlass = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 1.8), new THREE.MeshBasicMaterial({ color: 0x6c7fa8 }));
winGlass.position.set(-11.28, 7.8, -2);
winGlass.rotation.y = 0.12;
scene.add(winGlass);

// تلال الخلفية الهادئة البعيدة
const hillMat = new THREE.MeshStandardMaterial({ color: 0x7aa588, roughness: 0.95 });
const hill1 = new THREE.Mesh(new THREE.SphereGeometry(15, 24, 16), hillMat);
hill1.scale.set(1.6, 0.4, 1);
hill1.position.set(-5, -4.0, -16);
scene.add(hill1);

const hill2 = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 16), hillMat);
hill2.scale.set(1.5, 0.38, 1);
hill2.position.set(8, -4.5, -18);
scene.add(hill2);

// بيت الحديقة (جدران وسقف متصل غير طافٍ)
const houseWall = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 8), new THREE.MeshStandardMaterial({ color: 0xffe0b2 }));
houseWall.position.set(12.5, 2.5, -5);
houseWall.castShadow = true;
scene.add(houseWall);

const houseRoof = new THREE.Mesh(new THREE.ConeGeometry(5, 3.2, 4), new THREE.MeshStandardMaterial({ color: 0xcc5829 }));
houseRoof.position.set(12.5, 6.6, -5);
houseRoof.rotation.y = Math.PI / 4;
houseRoof.castShadow = true;
scene.add(houseRoof);

// سحب بيضاء كرتونية مسطحة
function addCloud(x, y, z) {
  const g = new THREE.Group();
  const cMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const p1 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 14, 14), cMat);
  const p2 = new THREE.Mesh(new THREE.SphereGeometry(1.35, 14, 14), cMat);
  p2.position.set(0.9, 0.2, 0);
  const p3 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 14), cMat);
  p3.position.set(1.8, -0.1, 0);
  g.add(p1, p2, p3);
  g.position.set(x, y, z);
  scene.add(g);
}
addCloud(-6.5, 7.5, -10);
addCloud(5.5, 8.2, -12);

// --- 4. السياج الخشبي الكلاسيكي ---
const fenceGroup = new THREE.Group();
for (let z = -6.5; z <= 6.5; z += 0.72) {
  const plank = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.3, 0.68), woodSlatMat);
  plank.position.set(0, 1.65, z);
  plank.castShadow = true;
  plank.receiveShadow = true;
  fenceGroup.add(plank);
}
const beamTop = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 13.8), woodSlatMat);
beamTop.position.set(0, 3.0, 0);
beamTop.castShadow = true;
fenceGroup.add(beamTop);

const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.7, 0.5), postYellowMat);
post.position.set(0, 1.85, 2.8);
post.castShadow = true;
post.receiveShadow = true;
fenceGroup.add(post);

const postCap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.45, 4), postYellowMat);
postCap.position.set(0, 3.9, 2.8);
postCap.rotation.y = Math.PI / 4;
fenceGroup.add(postCap);
scene.add(fenceGroup);

// --- 5. شخصية القط (Fleabag) بملامحه الكرتونية الحقيقية ---
const catGroup = new THREE.Group();
const catMat = new THREE.MeshStandardMaterial({ color: 0x22a4a2, roughness: 0.5 });
const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff4081 });
const bandageMat = new THREE.MeshStandardMaterial({ color: 0xfbf6e6, roughness: 0.9 });

// جسم القط المنحني الجالس
const catTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.7, 1.25, 18), catMat);
catTorso.position.y = 0.62;
catTorso.castShadow = true;
catGroup.add(catTorso);

// رأس القط العريض
const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.68, 20, 20), catMat);
catHead.position.set(0.12, 1.55, 0);
catHead.scale.set(1.15, 0.95, 1);
catHead.castShadow = true;
catGroup.add(catHead);

// آذان القط مع لفة الشاش
const earL = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 4), catMat);
earL.position.set(0.0, 2.15, 0.35);
earL.rotation.set(0.15, 0, 0.15);
catGroup.add(earL);

const earR = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 4), catMat);
earR.position.set(0.0, 2.15, -0.35);
earR.rotation.set(-0.15, 0, 0.15);
catGroup.add(earR);

// ضمادة الجبين البيضاء
const gauze = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.55), bandageMat);
gauze.position.set(0.25, 1.98, 0.1);
gauze.rotation.set(0.1, 0, -0.22);
catGroup.add(gauze);

// عيون كرتونية واسعة متجهة نحو الكلب
function createEye(x, y, z, lookDir = 1) {
  const eye = new THREE.Group();
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), whiteMat);
  sclera.scale.set(1, 1.25, 0.9);
  eye.add(sclera);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), blackMat);
  pupil.position.set(0.14 * lookDir, 0, 0);
  eye.add(pupil);
  eye.position.set(x, y, z);
  return eye;
}
catGroup.add(createEye(0.58, 1.62, 0.22, 1));
catGroup.add(createEye(0.58, 1.62, -0.22, 1));

// أنف القط الوردي
const cNose = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 4), pinkMat);
cNose.position.set(0.72, 1.48, 0);
cNose.rotation.z = -Math.PI / 2;
catGroup.add(cNose);

// ذيل القط المنحني للأعلى
const catTailCurve = new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(-0.35, 0.2, 0),
  new THREE.Vector3(-1.0, 0.75, 0),
  new THREE.Vector3(-0.65, 1.45, 0)
);
const tailMesh = new THREE.Mesh(new THREE.TubeGeometry(catTailCurve, 20, 0.08, 8, false), catMat);
tailMesh.castShadow = true;
catGroup.add(tailMesh);

// الصندوق وبرميل النفايات المليء
const seatBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.05, 1.2), new THREE.MeshStandardMaterial({ color: 0xd7ccc8 }));
seatBox.position.set(-7.5, 0.52, 0);
seatBox.castShadow = true;
seatBox.receiveShadow = true;
scene.add(seatBox);

const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.7, 1.45, 20), new THREE.MeshStandardMaterial({ color: 0x8a979e, roughness: 0.6 }));
bin.position.set(-6.1, 0.72, 0);
bin.castShadow = true;
bin.receiveShadow = true;
scene.add(bin);

const trash = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 14), new THREE.MeshStandardMaterial({ color: 0x546e7a }));
trash.position.set(-6.1, 1.45, 0);
scene.add(trash);

catGroup.position.set(-7.5, 1.05, 0);
scene.add(catGroup);

// --- 6. شخصية الكلب (Mutt) بالابتسامة العريضة الأصلية ---
const dogGroup = new THREE.Group();
const dogFur = new THREE.MeshStandardMaterial({ color: 0x7c6453, roughness: 0.65 });
const muzzleCream = new THREE.MeshStandardMaterial({ color: 0xf5ebe1, roughness: 0.6 });
const earDark = new THREE.MeshStandardMaterial({ color: 0x4a3a2f, roughness: 0.7 });

// جسم الكلب الواقف
const dogBody = new THREE.Mesh(new THREE.SphereGeometry(0.96, 20, 20), dogFur);
dogBody.scale.set(1, 1.15, 1);
dogBody.position.y = 0.95;
dogBody.castShadow = true;
dogGroup.add(dogBody);

// أقدام الكلب الواقف
const dPawL = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), muzzleCream);
dPawL.position.set(-0.35, 0.2, 0.42);
dPawL.scale.set(1.2, 0.7, 1);
dPawL.castShadow = true;
dogGroup.add(dPawL);

const dPawR = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), muzzleCream);
dPawR.position.set(-0.35, 0.2, -0.42);
dPawR.scale.set(1.2, 0.7, 1);
dPawR.castShadow = true;
dogGroup.add(dPawR);

// رأس الكلب
const dogHead = new THREE.Mesh(new THREE.SphereGeometry(0.86, 20, 20), dogFur);
dogHead.position.set(-0.15, 1.9, 0);
dogHead.castShadow = true;
dogGroup.add(dogHead);

// آذان الكلب المتدلية الطويلة
const dEarL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 1.1, 12), earDark);
dEarL.position.set(-0.1, 1.7, 0.92);
dEarL.rotation.set(0.3, 0, 0);
dEarL.castShadow = true;
dogGroup.add(dEarL);

const dEarR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 1.1, 12), earDark);
dEarR.position.set(-0.1, 1.7, -0.92);
dEarR.rotation.set(-0.3, 0, 0);
dEarR.castShadow = true;
dogGroup.add(dEarR);

// الفم والفك العريض واللسان (ابتسامة الكلب الأيقونية)
const dMuzzle = new THREE.Mesh(new THREE.SphereGeometry(0.6, 18, 18), muzzleCream);
dMuzzle.position.set(-0.55, 1.75, 0);
dMuzzle.scale.set(1.15, 0.8, 1.4);
dogGroup.add(dMuzzle);

// تجويف الفم المفتوح بالأسنان واللسان
const mouthCavity = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.35, 0.72), blackMat);
mouthCavity.position.set(-0.85, 1.62, 0);
dogGroup.add(mouthCavity);

const dogTongue = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.34, 0.28), new THREE.MeshBasicMaterial({ color: 0xf05454 }));
dogTongue.position.set(-0.92, 1.45, 0);
dogTongue.rotation.z = -0.32;
dogGroup.add(dogTongue);

const dNose = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), blackMat);
dNose.position.set(-1.05, 1.9, 0);
dogGroup.add(dNose);

dogGroup.add(createEye(-0.62, 2.18, 0.28, -1));
dogGroup.add(createEye(-0.62, 2.18, -0.28, -1));

dogGroup.position.set(7.2, 0, 0);
scene.add(dogGroup);

// صحن طعام الكلب
const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.45, 0.32, 16), new THREE.MeshStandardMaterial({ color: 0xef6c00 }));
bowl.position.set(5.5, 0.16, 0);
bowl.castShadow = true;
scene.add(bowl);

const bone = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.14), whiteMat);
bone.position.set(5.5, 0.35, 0);
bone.rotation.set(0.2, 0.4, 0);
scene.add(bone);

// --- 7. نظام الأسئلة واللعب والرمي ---
let catHp = 100;
let dogHp = 100;
let wind = 0;
let turn = 'CAT';
let isCharging = false;
let chargePower = 0;
let projectile = null;
let canThrow = false;

const questions = [
  { q: "Dogs like to chew on ____.", opts: ["BONES", "STONES", "CLOUDS"], ans: "BONES" },
  { q: "The cat is sitting ____ the wooden box.", opts: ["ON", "INTO", "UNDER"], ans: "ON" },
  { q: "What stands in the middle of the yards?", opts: ["FENCE", "RIVER", "CAR"], ans: "FENCE" },
  { q: "Yesterday the dog ____ a big bone.", opts: ["ATE", "EATING", "EATS"], ans: "ATE" }
];

function updateWind() {
  wind = (Math.random() * 8 - 4).toFixed(1);
  if (windTxtEl) {
    windTxtEl.innerText = `WIND: ${wind > 0 ? '▶▶ ' : '◀◀ '} ${Math.abs(wind)}`;
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
    quizBox.style.display = 'flex';
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
      quizBox.style.transform = 'translate(-46%, 0)';
      setTimeout(() => (quizBox.style.transform = 'translate(-50%, 0)'), 100);
    }
  }
};

window.addEventListener('mousedown', (e) => {
  if (e && e.target && typeof e.target.closest === 'function' && e.target.closest('#quiz-box')) return;
  if (!canThrow || turn !== 'CAT' || projectile) return;
  isCharging = true;
  chargePower = 0;
  if (powerMeter) powerMeter.style.display = 'block';
});

window.addEventListener('mouseup', () => {
  if (isCharging) {
    isCharging = false;
    if (powerMeter) powerMeter.style.display = 'none';
    fireProjectile(chargePower);
  }
});

function fireProjectile(power) {
  canThrow = false;
  audio.sfxThrow();

  const boneGroup = new THREE.Group();
  const bMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), bMat);
  shaft.rotation.z = Math.PI / 2;
  shaft.castShadow = true;
  boneGroup.add(shaft);

  const k1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), bMat);
  k1.position.set(-0.3, 0.07, 0);
  k1.castShadow = true;
  boneGroup.add(k1);
  const k2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), bMat);
  k2.position.set(0.3, 0.07, 0);
  k2.castShadow = true;
  boneGroup.add(k2);

  projectile = boneGroup;
  projectile.castShadow = true;

  if (turn === 'CAT') {
    projectile.position.set(-7.0, 2.6, 0);
    const speed = 7.2 + power * 0.12;
    projectile.userData = {
      vx: speed * 0.72 + wind * 0.22,
      vy: speed * 0.82,
      vz: 0
    };
  } else {
    projectile.position.set(6.5, 2.3, 0);
    const speed = 7.2 + power * 0.12;
    projectile.userData = {
      vx: -speed * 0.72 + wind * 0.22,
      vy: speed * 0.82,
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
    projectile = null;
  }
  updateWind();
  promptQuestion();
}
window.restartGame = restartGame;

function endTurn() {
  if (projectile) {
    scene.remove(projectile);
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
  const estimatedPower = Math.min(Math.max(48 - wind * 3.2 + (Math.random() * 8 - 4), 20), 92);
  fireProjectile(estimatedPower);
}

// --- 8. حلقة التحديث المستمر ---
let lastTime = performance.now();
const startTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  const time = (now - startTime) / 1000;

  catGroup.position.y = 1.05 + Math.sin(time * 3.5) * 0.025;
  dogGroup.position.y = Math.sin(time * 3.2) * 0.025;
  tailMesh.rotation.z = Math.sin(time * 4) * 0.08;

  if (isCharging && chargePower < 100) {
    chargePower += 1.8;
    if (powerFill) powerFill.style.width = `${chargePower}%`;
  }

  if (projectile) {
    projectile.userData.vy -= 9.8 * delta;
    projectile.userData.vx += wind * 0.35 * delta;
    projectile.position.x += projectile.userData.vx * delta;
    projectile.position.y += projectile.userData.vy * delta;
    projectile.rotation.z += 10 * delta;

    if (projectile.position.y <= 0.2) {
      audio.sfxHit();
      endTurn();
    } else if (Math.abs(projectile.position.x) < 0.25 && projectile.position.y < 3.4) {
      audio.sfxHit();
      endTurn();
    } else if (turn === 'CAT' && projectile.position.distanceTo(dogGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0))) < 1.4) {
      audio.sfxHit();
      dogHp = Math.max(0, dogHp - 25);
      if (dogHpEl) dogHpEl.style.width = `${dogHp}%`;
      endTurn();
    } else if (turn === 'DOG' && projectile.position.distanceTo(catGroup.position.clone().add(new THREE.Vector3(0, 1.0, 0))) < 1.4) {
      audio.sfxHit();
      catHp = Math.max(0, catHp - 25);
      if (catHpEl) catHpEl.style.width = `${catHp}%`;
      endTurn();
    }
  }

  renderer.render(scene, camera);
}

// Global debug exposure for testing and automation
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
  promptQuestion,
  restartGame
};

updateWind();
promptQuestion();
animate();
