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

// --- 1. المشهد والكاميرا ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6ec6f1);
scene.fog = new THREE.Fog(0x6ec6f1, 22, 55);

const camera = new THREE.PerspectiveCamera(40, 1024 / 576, 0.1, 100);
camera.position.set(0, 5.2, 16.5);
camera.lookAt(0, 1.3, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(1024, 576);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

// --- 2. إضاءة كرتونية ناعمة ومشرقة ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x446622, 1.2);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff6e5, 2.3);
sun.position.set(12, 20, 14);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 40;
sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -15;
sun.shadow.bias = -0.0006;
scene.add(sun);

const ambientFill = new THREE.DirectionalLight(0x80deea, 0.7);
ambientFill.position.set(-14, 8, -6);
scene.add(ambientFill);

// --- 3. البيئة ثلاثية الأبعاد الممتدة للأفق ---
// خامات كرتونية مطفأة
const alleyMat = new THREE.MeshStandardMaterial({ color: 0x8a99a4, roughness: 0.85 });
const grassMat = new THREE.MeshStandardMaterial({ color: 0x5da832, roughness: 0.7 });
const hillMat = new THREE.MeshStandardMaterial({ color: 0x4a8f28, roughness: 0.9 });
const wallMat = new THREE.MeshStandardMaterial({ color: 0x9c43a8, roughness: 0.8 });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6645, roughness: 0.75 });
const woodLightMat = new THREE.MeshStandardMaterial({ color: 0xf5c366, roughness: 0.7 });

// أرضية الزقاق المرصوفة
const alley = new THREE.Mesh(new THREE.PlaneGeometry(16, 26), alleyMat);
alley.rotation.x = -Math.PI / 2;
alley.position.set(-8, 0, 0);
alley.receiveShadow = true;
scene.add(alley);

// أرضية الحديقة الخضراء
const yard = new THREE.Mesh(new THREE.PlaneGeometry(16, 26), grassMat);
yard.rotation.x = -Math.PI / 2;
yard.position.set(8, 0, 0);
yard.receiveShadow = true;
scene.add(yard);

// جدار الزقاق البنفسجي المرتفع
const alleyWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 14, 26), wallMat);
alleyWall.position.set(-14.5, 7, 0);
alleyWall.receiveShadow = true;
scene.add(alleyWall);

// تلال كرتونية ثلاثية الأبعاد في الأفق تملأ الفراغ
function createBackgroundHills() {
  const hill1 = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 16), hillMat);
  hill1.scale.set(1.4, 0.6, 1);
  hill1.position.set(-8, -4, -18);
  scene.add(hill1);

  const hill2 = new THREE.Mesh(new THREE.SphereGeometry(22, 24, 16), hillMat);
  hill2.scale.set(1.5, 0.55, 1);
  hill2.position.set(10, -5, -20);
  scene.add(hill2);
}
createBackgroundHills();

// سحب كرتونية ثلاثية الأبعاد في السماء
function createCloud(x, y, z) {
  const g = new THREE.Group();
  const cMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const spheres = [
    { r: 1.1, x: 0, y: 0 },
    { r: 1.5, x: 1.0, y: 0.2 },
    { r: 1.2, x: 2.1, y: -0.1 },
    { r: 0.9, x: 2.9, y: -0.2 }
  ];
  spheres.forEach(s => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(s.r, 16, 16), cMat);
    m.position.set(s.x, s.y, 0);
    g.add(m);
  });
  g.position.set(x, y, z);
  scene.add(g);
}
createCloud(-7, 8.5, -12);
createCloud(6, 9.5, -14);

// سقف قرميدي للحديقة في الزاوية
const roof = new THREE.Mesh(new THREE.ConeGeometry(4, 2.5, 4), new THREE.MeshStandardMaterial({ color: 0xd84315 }));
roof.position.set(13.5, 7.5, -6);
roof.rotation.y = Math.PI / 4;
scene.add(roof);

// --- 4. سياج خشبي كرتوني عريض وواقعي ---
const fenceGroup = new THREE.Group();
const plankGeo = new THREE.BoxGeometry(0.24, 3.2, 0.65);

for (let z = -5.5; z <= 5.5; z += 0.75) {
  const plank = new THREE.Mesh(plankGeo, woodMat);
  const jitterY = (Math.sin(z * 3) * 0.12);
  plank.position.set(0, 1.6 + jitterY, z);
  plank.castShadow = true;
  plank.receiveShadow = true;
  fenceGroup.add(plank);
}

// عارضتان أفقيتان تمسكان الألواح
const beamGeo = new THREE.BoxGeometry(0.32, 0.22, 11.8);
const beamTop = new THREE.Mesh(beamGeo, woodMat);
beamTop.position.set(0, 2.4, 0);
beamTop.castShadow = true;
fenceGroup.add(beamTop);

const beamBottom = new THREE.Mesh(beamGeo, woodMat);
beamBottom.position.set(0, 0.8, 0);
beamBottom.castShadow = true;
fenceGroup.add(beamBottom);

// العمود الأمامي البارز
const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.6, 0.42), woodLightMat);
post.position.set(0, 1.8, 1.8);
post.castShadow = true;
fenceGroup.add(post);

scene.add(fenceGroup);

// --- 5. شخصية القط 3D (Fleabag Cat) مع التفاصيل ---
const catGroup = new THREE.Group();
const catFur = new THREE.MeshStandardMaterial({ color: 0x00acc1, roughness: 0.45 });
const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff4081 });
const bandageMat = new THREE.MeshStandardMaterial({ color: 0xfff9c4 });

// جسم القط المنحني
const catTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.72, 1.3, 18), catFur);
catTorso.position.y = 0.65;
catTorso.castShadow = true;
catGroup.add(catTorso);

// رأس القط
const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.68, 20, 20), catFur);
catHead.position.set(0.12, 1.6, 0);
catHead.castShadow = true;
catGroup.add(catHead);

// آذان القط مع الشاش الملفوف
const earL = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 4), catFur);
earL.position.set(0.0, 2.2, 0.35);
earL.rotation.set(0.2, 0, 0.2);
catGroup.add(earL);

const earR = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 4), catFur);
earR.position.set(0.0, 2.2, -0.35);
earR.rotation.set(-0.2, 0, 0.2);
catGroup.add(earR);

// ضمادة الرأس البيضاء
const catGauze = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.55), bandageMat);
catGauze.position.set(0.25, 2.05, 0.1);
catGauze.rotation.set(0.1, 0, -0.25);
catGroup.add(catGauze);

// عيون كرتونية بيضاوية مع بريق
function createToonEye(x, y, z, lookDir = 1) {
  const eye = new THREE.Group();
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), whiteMat);
  sclera.scale.set(1, 1.15, 0.9);
  eye.add(sclera);

  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), blackMat);
  pupil.position.set(0.15 * lookDir, 0, 0);
  eye.add(pupil);

  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), whiteMat);
  shine.position.set(0.18 * lookDir, 0.06, 0);
  eye.add(shine);

  eye.position.set(x, y, z);
  return eye;
}
catGroup.add(createToonEye(0.62, 1.66, 0.22, 1));
catGroup.add(createToonEye(0.62, 1.66, -0.22, 1));

// أنف القط الوردي
const cNose = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 4), pinkMat);
cNose.position.set(0.75, 1.5, 0);
cNose.rotation.z = -Math.PI / 2;
catGroup.add(cNose);

// ذيل القط
const catTailCurve = new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(-0.4, 0.2, 0),
  new THREE.Vector3(-1.1, 0.8, 0),
  new THREE.Vector3(-0.7, 1.5, 0)
);
const tailMesh = new THREE.Mesh(new THREE.TubeGeometry(catTailCurve, 20, 0.08, 8, false), catFur);
tailMesh.castShadow = true;
catGroup.add(tailMesh);

// الصندوق الخشبي الذي يجلس عليه القط
const seatBox = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.3), new THREE.MeshStandardMaterial({ color: 0xd7ccc8 }));
seatBox.position.set(-8.2, 0.55, 0);
seatBox.castShadow = true;
seatBox.receiveShadow = true;
scene.add(seatBox);

// برميل النفايات
const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.72, 1.5, 20), new THREE.MeshStandardMaterial({ color: 0x78909c, metalness: 0.35 }));
bin.position.set(-6.6, 0.75, 0);
bin.castShadow = true;
bin.receiveShadow = true;
scene.add(bin);

catGroup.position.set(-8.2, 1.1, 0);
scene.add(catGroup);

// --- 6. شخصية الكلب 3D (Mutt) مع الابتسامة العريضة ---
const dogGroup = new THREE.Group();
const dogFur = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.6 });
const muzzleMat = new THREE.MeshStandardMaterial({ color: 0xf5ebe6, roughness: 0.5 });
const earMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.65 });

// جسم الكلب
const dogBody = new THREE.Mesh(new THREE.SphereGeometry(0.96, 20, 20), dogFur);
dogBody.scale.set(1, 1.15, 1);
dogBody.position.y = 1.0;
dogBody.castShadow = true;
dogGroup.add(dogBody);

// أقدام الكلب الواقف
const dPawL = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), muzzleMat);
dPawL.position.set(-0.35, 0.2, 0.45);
dPawL.scale.set(1.2, 0.7, 1);
dPawL.castShadow = true;
dogGroup.add(dPawL);

const dPawR = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), muzzleMat);
dPawR.position.set(-0.35, 0.2, -0.45);
dPawR.scale.set(1.2, 0.7, 1);
dPawR.castShadow = true;
dogGroup.add(dPawR);

// رأس الكلب
const dogHead = new THREE.Mesh(new THREE.SphereGeometry(0.86, 20, 20), dogFur);
dogHead.position.set(-0.15, 2.0, 0);
dogHead.castShadow = true;
dogGroup.add(dogHead);

// آذان الكلب المتدلية
const dogEarL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 1.1, 12), earMat);
dogEarL.position.set(-0.1, 1.8, 0.95);
dogEarL.rotation.set(0.3, 0, 0);
dogEarL.castShadow = true;
dogGroup.add(dogEarL);

const dogEarR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 1.1, 12), earMat);
dogEarR.position.set(-0.1, 1.8, -0.95);
dogEarR.rotation.set(-0.3, 0, 0);
dogEarR.castShadow = true;
dogGroup.add(dogEarR);

// الفم والابتسامة الكرتونية العريضة (Mutt's Grin)
const dogMuzzle = new THREE.Mesh(new THREE.SphereGeometry(0.56, 16, 16), muzzleMat);
dogMuzzle.position.set(-0.62, 1.8, 0);
dogMuzzle.scale.set(1.1, 0.75, 1.35);
dogGroup.add(dogMuzzle);

// تجويف الفم المفتوح
const mouthHole = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.65), blackMat);
mouthHole.position.set(-0.95, 1.7, 0);
dogGroup.add(mouthHole);

// لسان الكلب المتدلي
const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.26), pinkMat);
tongue.position.set(-1.0, 1.5, 0);
tongue.rotation.z = -0.35;
dogGroup.add(tongue);

// أنف الكلب
const dogNose = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), blackMat);
dogNose.position.set(-1.1, 1.95, 0);
dogGroup.add(dogNose);

// عيون الكلب الضاحكة
dogGroup.add(createToonEye(-0.68, 2.3, 0.3, -1));
dogGroup.add(createToonEye(-0.68, 2.3, -0.3, -1));

dogGroup.position.set(7.5, 0, 0);
scene.add(dogGroup);

// صحن طعام الكلب
const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.45, 0.35, 16), new THREE.MeshStandardMaterial({ color: 0xe65100 }));
bowl.position.set(5.8, 0.18, 0);
bowl.castShadow = true;
scene.add(bowl);

// عظمة في الصحن
const bone = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.14), whiteMat);
bone.position.set(5.8, 0.36, 0);
bone.rotation.set(0.2, 0.4, 0);
scene.add(bone);

// --- 7. نظام الأسئلة واللعب ---
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
  wind = parseFloat((Math.random() * 8 - 4).toFixed(1));
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
      setTimeout(() => (quizBox.style.transform = 'translate(-50%, -50%)'), 100);
    }
  }
};

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

  if (turn === 'CAT') {
    projectile.position.set(-7.5, 2.7, 0);
    const speed = 7 + power * 0.12;
    projectile.userData = {
      vx: speed * 0.72 + wind * 0.22,
      vy: speed * 0.8,
      vz: 0
    };
  } else {
    projectile.position.set(6.8, 2.4, 0);
    const speed = 7 + power * 0.12;
    projectile.userData = {
      vx: -speed * 0.72 + wind * 0.22,
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
  audio.sfxThrow();
  fireProjectile(estimatedPower);
}

// --- 8. حلقة التحديث والرندرة ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // تنفس وحركة كرتونية خفيفة
  catGroup.position.y = 1.1 + Math.sin(time * 4) * 0.03;
  dogGroup.position.y = Math.sin(time * 3.5) * 0.03;
  tailMesh.rotation.z = Math.sin(time * 5) * 0.1;

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

    // الاصطدام بالأرض
    if (projectile.position.y <= 0.2) {
      audio.sfxHit();
      endTurn();
    }
    // الاصطدام بالسياج الخشبي العريض
    else if (Math.abs(projectile.position.x) < 0.25 && projectile.position.y < 3.2) {
      audio.sfxHit();
      endTurn();
    }
    // إصابة الكلب
    else if (turn === 'CAT' && projectile.position.distanceTo(dogGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0))) < 1.4) {
      audio.sfxHit();
      dogHp = Math.max(0, dogHp - 25);
      if (dogHpEl) dogHpEl.style.width = `${dogHp}%`;
      endTurn();
    }
    // إصابة القط
    else if (turn === 'DOG' && projectile.position.distanceTo(catGroup.position.clone().add(new THREE.Vector3(0, 1.0, 0))) < 1.4) {
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
  promptQuestion,
  restartGame
};

updateWind();
promptQuestion();
animate();
