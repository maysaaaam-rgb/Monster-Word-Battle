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

// --- 1. المشهد والكاميرا ومحرك الرندرة ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7ec8e3);
scene.fog = new THREE.Fog(0x7ec8e3, 20, 50);

const camera = new THREE.PerspectiveCamera(42, 1024 / 576, 0.1, 100);
camera.position.set(0, 4.5, 17);
camera.lookAt(0, 1.4, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(1024, 576);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.appendChild(renderer.domElement);

// --- 2. إضاءة كرتونية سينمائية ثلاثية الأبعاد ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x556b2f, 1.1);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
sunLight.position.set(12, 18, 14);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 40;
sunLight.shadow.camera.left = -14;
sunLight.shadow.camera.right = 14;
sunLight.shadow.camera.top = 14;
sunLight.shadow.camera.bottom = -14;
sunLight.shadow.bias = -0.0008;
scene.add(sunLight);

// إضاءة تعبئة ناعمة للألوان (Rim/Fill Light)
const rimLight = new THREE.DirectionalLight(0x80deea, 0.8);
rimLight.position.set(-15, 10, -8);
scene.add(rimLight);

// --- إنشاء تدرج لوني كرتوني ذي خطوتين فقط (ضوء وظل حاد / 2-Tone Cel-Shading) ---
const format = THREE.RGBAFormat;
const colors = new Uint8Array([
  80, 80, 80, 255,   // لون الظل الكرتوني
  255, 255, 255, 255 // لون الضوء
]);
const gradientMap = new THREE.DataTexture(colors, 2, 1, format);
gradientMap.needsUpdate = true;
gradientMap.minFilter = THREE.NearestFilter;
gradientMap.magFilter = THREE.NearestFilter;

// خامات الشخصيات الكرتونية
const catToonMat = new THREE.MeshToonMaterial({
  color: 0x00bcd4,
  gradientMap: gradientMap
});

const dogToonMat = new THREE.MeshToonMaterial({
  color: 0x8d6e63,
  gradientMap: gradientMap
});

const woodToonMat = new THREE.MeshToonMaterial({
  color: 0xffb74d,
  gradientMap: gradientMap
});

// --- 3. الأرضيات والبيئة المقسمة ---
// أرضية الزقاق المرصوف (يسار)
const alleyFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(16, 20),
  new THREE.MeshToonMaterial({ color: 0x90a4ae, gradientMap })
);
alleyFloor.rotation.x = -Math.PI / 2;
alleyFloor.position.set(-8, 0, 0);
alleyFloor.receiveShadow = true;
scene.add(alleyFloor);

// أرضية العشب الأخضر للحديقة (يمين)
const yardFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(16, 20),
  new THREE.MeshToonMaterial({ color: 0x558b2f, gradientMap })
);
yardFloor.rotation.x = -Math.PI / 2;
yardFloor.position.set(8, 0, 0);
yardFloor.receiveShadow = true;
scene.add(yardFloor);

// جدار الزقاق البنفسجي الأيقوني (يسار)
const alleyWall = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 12, 20),
  new THREE.MeshToonMaterial({ color: 0x8e24aa, gradientMap })
);
alleyWall.position.set(-14, 6, 0);
alleyWall.receiveShadow = true;
scene.add(alleyWall);

// سقف قرميدي على زاوية الحديقة الخلفية (يمين)
const roof = new THREE.Mesh(
  new THREE.ConeGeometry(4, 3, 4),
  new THREE.MeshToonMaterial({ color: 0xd84315, gradientMap })
);
roof.position.set(13, 8, -6);
roof.rotation.y = Math.PI / 4;
scene.add(roof);

// سحب كرتونية 3D طافية في السماء
function createCloud(x, y, z) {
  const cloudGroup = new THREE.Group();
  const cloudMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap });
  const parts = [
    { r: 0.9, x: 0, y: 0 },
    { r: 1.3, x: 0.8, y: 0.2 },
    { r: 1.1, x: 1.7, y: -0.1 },
    { r: 0.8, x: 2.3, y: -0.2 }
  ];
  parts.forEach(p => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(p.r, 16, 16), cloudMat);
    s.position.set(p.x, p.y, 0);
    cloudGroup.add(s);
  });
  cloudGroup.position.set(x, y, z);
  scene.add(cloudGroup);
}
createCloud(-6, 8, -8);
createCloud(5, 9, -10);

// --- 4. سياج خشبي واقعي ثلاثي الأبعاد (Center Fence) ---
const fenceGroup = new THREE.Group();
const woodMat = new THREE.MeshToonMaterial({ color: 0x8d6e63, gradientMap });
const postMat = woodToonMat;

// ألواح الخشب المتراصة
for (let i = -3; i <= 3; i++) {
  const plank = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.4, 0.45), woodMat);
  plank.position.set(0, 1.7, i * 0.48);
  plank.castShadow = true;
  plank.receiveShadow = true;
  fenceGroup.add(plank);
}

// العمود الأصفر الرئيسي الأمامي بالسقف الهرمي
const fencePost = new THREE.Mesh(new THREE.BoxGeometry(0.48, 3.8, 0.48), postMat);
fencePost.position.set(0, 1.9, 1.7);
fencePost.castShadow = true;
fencePost.receiveShadow = true;
fenceGroup.add(fencePost);

const postCap = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.4, 4), postMat);
postCap.position.set(0, 3.9, 1.7);
postCap.rotation.y = Math.PI / 4;
postCap.castShadow = true;
fenceGroup.add(postCap);

scene.add(fenceGroup);

// --- 5. القط الكرتوني 3D (Fleabag Cat) ---
const catGroup = new THREE.Group();
const catMat = catToonMat;
const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
const pinkMat = new THREE.MeshToonMaterial({ color: 0xff4081, gradientMap });
const bandageMat = new THREE.MeshToonMaterial({ color: 0xfff9c4, gradientMap });

// جسم القط المنحني الجالس
const catTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 1.3, 16), catMat);
catTorso.position.y = 0.65;
catTorso.castShadow = true;
catGroup.add(catTorso);

// رأس القط
const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.68, 20, 20), catMat);
catHead.position.set(0.1, 1.6, 0);
catHead.castShadow = true;
catGroup.add(catHead);

// آذان القط الحادة
const earL = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 4), catMat);
earL.position.set(-0.1, 2.25, 0.35);
earL.rotation.set(0.2, 0, 0.2);
catGroup.add(earL);

const earR = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 4), catMat);
earR.position.set(-0.1, 2.25, -0.35);
earR.rotation.set(-0.2, 0, 0.2);
catGroup.add(earR);

// لفة الشاش والضمادة فوق الرأس
const gauze = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.6), bandageMat);
gauze.position.set(0.25, 2.05, 0.1);
gauze.rotation.set(0.1, 0, -0.3);
catGroup.add(gauze);

// العيون الكرتونية الناظرة باتجاه الكلب
function createEye(x, y, z) {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), eyeWhiteMat);
  eye.position.set(x, y, z);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), blackMat);
  pupil.position.set(0.12, 0, 0);
  eye.add(pupil);
  return eye;
}
catGroup.add(createEye(0.6, 1.65, 0.22));
catGroup.add(createEye(0.6, 1.65, -0.22));

// الأنف الوردي
const catNose = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 4), pinkMat);
catNose.position.set(0.72, 1.48, 0);
catNose.rotation.z = -Math.PI / 2;
catGroup.add(catNose);

// ذيل القط المنحني
const tailCurve = new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(-0.4, 0.2, 0),
  new THREE.Vector3(-1.2, 0.8, 0),
  new THREE.Vector3(-0.7, 1.6, 0)
);
const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 20, 0.08, 8, false), catMat);
tail.castShadow = true;
catGroup.add(tail);

// برميل القمامة المعدني وصندوق الجلوس
const bin = new THREE.Mesh(
  new THREE.CylinderGeometry(0.85, 0.72, 1.5, 20),
  new THREE.MeshToonMaterial({ color: 0x78909c, gradientMap })
);
bin.position.set(-6.8, 0.75, 0);
bin.castShadow = true;
bin.receiveShadow = true;
scene.add(bin);

// الصندوق الخشبي الذي يجلس عليه القط بجانب البرميل
const seatBox = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 1.1, 1.2),
  new THREE.MeshToonMaterial({ color: 0xd7ccc8, gradientMap })
);
seatBox.position.set(-8.2, 0.55, 0);
seatBox.castShadow = true;
seatBox.receiveShadow = true;
scene.add(seatBox);

catGroup.position.set(-8.2, 1.1, 0);
scene.add(catGroup);

// --- 6. الكلب الكرتوني 3D الضاحك (Mutt Dog) ---
const dogGroup = new THREE.Group();
const dogFurMat = dogToonMat;
const muzzleMat = new THREE.MeshToonMaterial({ color: 0xefebe9, gradientMap });
const earDogMat = new THREE.MeshToonMaterial({ color: 0x4e342e, gradientMap });

// جسم الكلب العريض
const dogBody = new THREE.Mesh(new THREE.SphereGeometry(0.95, 20, 20), dogFurMat);
dogBody.scale.set(1, 1.15, 1);
dogBody.position.y = 1.0;
dogBody.castShadow = true;
dogGroup.add(dogBody);

// أقدام الكلب الواقف بثبات
const pawL = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), muzzleMat);
pawL.position.set(-0.35, 0.2, 0.45);
pawL.scale.set(1.2, 0.7, 1);
pawL.castShadow = true;
dogGroup.add(pawL);

const pawR = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), muzzleMat);
pawR.position.set(-0.35, 0.2, -0.45);
pawR.scale.set(1.2, 0.7, 1);
pawR.castShadow = true;
dogGroup.add(pawR);

// رأس الكلب الكرتوني
const dogHead = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 20), dogFurMat);
dogHead.position.set(-0.15, 2.0, 0);
dogHead.castShadow = true;
dogGroup.add(dogHead);

// آذان الكلب المتدلية
const dogEarL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 1.1, 12), earDogMat);
dogEarL.position.set(-0.1, 1.8, 0.95);
dogEarL.rotation.set(0.3, 0, 0);
dogEarL.castShadow = true;
dogGroup.add(dogEarL);

const dogEarR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 1.1, 12), earDogMat);
dogEarR.position.set(-0.1, 1.8, -0.95);
dogEarR.rotation.set(-0.3, 0, 0);
dogEarR.castShadow = true;
dogGroup.add(dogEarR);

// الفم العريض والابتسامة الكرتونية (الخطم العريض)
const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), muzzleMat);
muzzle.position.set(-0.65, 1.8, 0);
muzzle.scale.set(1.1, 0.7, 1.3);
dogGroup.add(muzzle);

// أنف الكلب الأسود
const dogNose = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), blackMat);
dogNose.position.set(-1.1, 1.95, 0);
dogGroup.add(dogNose);

// اللسان الوردي المتدلي للأسفل
const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.28), pinkMat);
tongue.position.set(-1.0, 1.55, 0);
tongue.rotation.z = -0.3;
dogGroup.add(tongue);

// عيون الكلب الضاحكة المتجهة نحو القط
dogGroup.add(createEye(-0.7, 2.3, 0.3));
dogGroup.add(createEye(-0.7, 2.3, -0.3));

dogGroup.position.set(7.5, 0, 0);
scene.add(dogGroup);

// صحن طعام الكلب المليء بالعظام أمامه
const dogBowl = new THREE.Mesh(
  new THREE.CylinderGeometry(0.65, 0.45, 0.35, 16),
  new THREE.MeshToonMaterial({ color: 0xe65100, gradientMap })
);
dogBowl.position.set(6.0, 0.18, 0);
dogBowl.castShadow = true;
scene.add(dogBowl);

const boneInBowl = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.14, 0.14),
  new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap })
);
boneInBowl.position.set(6.0, 0.38, 0);
boneInBowl.rotation.set(0.2, 0.4, 0);
scene.add(boneInBowl);

// --- 7. نظام اللعب والأسئلة التعليمية ---
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
  { q: "The cat is sitting ____ the wooden box.", opts: ["ON", "INTO", "UNDER"], ans: "ON" },
  { q: "What stands in the middle of the yards?", opts: ["FENCE", "RIVER", "CAR"], ans: "FENCE" },
  { q: "Dogs like to chew on ____.", opts: ["BONES", "STONES", "CLOUDS"], ans: "BONES" }
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
  
  // مجسم المقذوف (عظمة كرتونية 3D)
  const boneGroup = new THREE.Group();
  const boneMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), boneMat);
  shaft.rotation.z = Math.PI / 2;
  shaft.castShadow = true;
  boneGroup.add(shaft);
  
  const knob1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), boneMat);
  knob1.position.set(-0.3, 0.07, 0);
  knob1.castShadow = true;
  boneGroup.add(knob1);

  const knob2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), boneMat);
  knob2.position.set(0.3, 0.07, 0);
  knob2.castShadow = true;
  boneGroup.add(knob2);

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

// --- 8. حلقة التحديث والرندرة (Animation Loop) ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // حركة تنفس كرتونية ناعمة للشخصيات
  catGroup.position.y = 1.1 + Math.sin(time * 4) * 0.03;
  dogGroup.position.y = Math.sin(time * 3.5) * 0.03;
  tail.rotation.z = Math.sin(time * 5) * 0.1;

  if (isCharging && chargePower < 100) {
    chargePower += 1.8;
    if (powerFill) powerFill.style.width = `${chargePower}%`;
  }

  // حركة المقذوف
  if (projectile) {
    projectile.userData.vy -= 9.8 * delta;
    projectile.userData.vx += wind * 0.35 * delta;
    projectile.position.x += projectile.userData.vx * delta;
    projectile.position.y += projectile.userData.vy * delta;
    projectile.rotation.z += 10 * delta;

    // اصطدام بالأرض
    if (projectile.position.y <= 0.2) {
      audio.sfxHit();
      endTurn();
    }
    // اصطدام بالسياج الخشبي
    else if (Math.abs(projectile.position.x) < 0.4 && projectile.position.y < 3.5) {
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
