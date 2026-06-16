import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';

const root = document.documentElement;
const canvas = document.getElementById('brain-scene');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointer = new THREE.Vector2(0, 0);
const targetPointer = new THREE.Vector2(0, 0);
const scrollState = { progress: 0, target: 0 };

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03040a, 0.035);
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0, 18);

const group = new THREE.Group();
scene.add(group);
scene.add(new THREE.AmbientLight(0x8fb8ff, 0.8));
const keyLight = new THREE.PointLight(0x72f7ff, 6, 44);
keyLight.position.set(-6, 4, 10);
scene.add(keyLight);
const violetLight = new THREE.PointLight(0x9b7cff, 4.4, 46);
violetLight.position.set(8, -4, 8);
scene.add(violetLight);

const nodeCount = 92;
const nodePositions = new Float32Array(nodeCount * 3);
const nodeSeeds = [];
for (let i = 0; i < nodeCount; i += 1) {
  const radius = 5 + Math.random() * 6;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  nodePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  nodePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  nodePositions[i * 3 + 2] = radius * Math.cos(phi);
  nodeSeeds.push({ radius, theta, phi, speed: 0.25 + Math.random() * 0.8, type: i % 9 });
}
const nodeGeometry = new THREE.BufferGeometry();
nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
const nodeMaterial = new THREE.PointsMaterial({
  size: 0.105,
  color: 0xbfe9ff,
  transparent: true,
  opacity: 0.94,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const points = new THREE.Points(nodeGeometry, nodeMaterial);
group.add(points);

const lineGeometry = new THREE.BufferGeometry();
const maxEdges = 210;
const linePositions = new Float32Array(maxEdges * 2 * 3);
lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0x9b7cff,
  transparent: true,
  opacity: 0.27,
  blending: THREE.AdditiveBlending,
});
const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
group.add(lines);

const particleCount = 340;
const particlePositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i += 1) {
  particlePositions[i * 3] = (Math.random() - 0.5) * 32;
  particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 22;
  particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 28;
}
const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMaterial = new THREE.PointsMaterial({ size: 0.025, color: 0xffffff, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending });
const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

function updateGraph(time) {
  const positions = nodeGeometry.attributes.position.array;
  const morph = scrollState.progress;
  for (let i = 0; i < nodeCount; i += 1) {
    const seed = nodeSeeds[i];
    const layer = 1 + Math.sin(morph * Math.PI * 2 + seed.type) * 0.18;
    const orbit = seed.theta + time * 0.00012 * seed.speed + morph * 2.1;
    const wave = Math.sin(time * 0.0007 + i) * 0.55;
    const pipelineBias = Math.sin(morph * Math.PI) * (i / nodeCount - 0.5) * 10;
    const x = seed.radius * layer * Math.sin(seed.phi + wave * 0.03) * Math.cos(orbit) + pointer.x * (1.4 + seed.type * 0.05) + pipelineBias;
    const y = seed.radius * layer * Math.sin(seed.phi) * Math.sin(orbit) + pointer.y * (0.9 + seed.type * 0.04) + Math.cos(morph * 5 + i) * 0.45;
    const z = seed.radius * Math.cos(seed.phi + morph * 0.55) + Math.sin(time * 0.0005 + i) * 0.55 - morph * 3;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  nodeGeometry.attributes.position.needsUpdate = true;

  let edge = 0;
  for (let i = 0; i < nodeCount && edge < maxEdges; i += 1) {
    for (let j = i + 1; j < nodeCount && edge < maxEdges; j += 1) {
      const ax = positions[i * 3], ay = positions[i * 3 + 1], az = positions[i * 3 + 2];
      const bx = positions[j * 3], by = positions[j * 3 + 1], bz = positions[j * 3 + 2];
      const distance = Math.hypot(ax - bx, ay - by, az - bz);
      if (distance < 2.8 + scrollState.progress * 0.9 && (i + j + Math.floor(time * 0.001)) % 3 !== 0) {
        const offset = edge * 6;
        linePositions[offset] = ax; linePositions[offset + 1] = ay; linePositions[offset + 2] = az;
        linePositions[offset + 3] = bx; linePositions[offset + 4] = by; linePositions[offset + 5] = bz;
        edge += 1;
      }
    }
  }
  for (let i = edge * 6; i < linePositions.length; i += 1) linePositions[i] = 0;
  lineGeometry.attributes.position.needsUpdate = true;
  lineGeometry.setDrawRange(0, edge * 2);
}

function animate(time = 0) {
  pointer.lerp(targetPointer, 0.065);
  scrollState.progress += (scrollState.target - scrollState.progress) * 0.06;
  updateGraph(time);
  group.rotation.y = time * 0.00008 + pointer.x * 0.08 + scrollState.progress * 0.9;
  group.rotation.x = pointer.y * 0.08 - scrollState.progress * 0.2;
  particles.rotation.y = -time * 0.000035;
  camera.position.z = 18 - scrollState.progress * 2.8;
  keyLight.position.x = -6 + pointer.x * 5;
  violetLight.position.y = -4 + pointer.y * 5;
  renderer.render(scene, camera);
  if (!prefersReduced) requestAnimationFrame(animate);
}

function syncScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollState.target = max > 0 ? window.scrollY / max : 0;
}
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);
window.addEventListener('scroll', syncScroll, { passive: true });
window.addEventListener('pointermove', (event) => {
  targetPointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
  targetPointer.y = -(event.clientY / window.innerHeight - 0.5) * 2;
  root.style.setProperty('--mx', `${event.clientX}px`);
  root.style.setProperty('--my', `${event.clientY}px`);
});
syncScroll();
animate();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.16 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const parallaxItems = [...document.querySelectorAll('[data-depth]')];
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  parallaxItems.forEach((item) => {
    const depth = Number(item.dataset.depth || 0);
    item.style.translate = `0 ${y * depth * -0.035}px`;
  });
}, { passive: true });

document.querySelectorAll('.magnetic').forEach((element) => {
  element.addEventListener('pointermove', (event) => {
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.16;
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
  element.addEventListener('pointerleave', () => {
    element.style.transform = '';
  });
});

const stages = [...document.querySelectorAll('.pipeline-stage')];
let activeStage = 0;
function setStage(index) {
  stages.forEach((stage) => stage.classList.toggle('active', Number(stage.dataset.step) === index));
  activeStage = index;
}
stages.forEach((stage) => stage.addEventListener('pointerenter', () => setStage(Number(stage.dataset.step))));
setInterval(() => setStage((activeStage + 1) % stages.length), 2200);

const chatLog = document.getElementById('chat-log');
const answerGrid = document.getElementById('answer-grid');
const consultation = [
  {
    question: 'Какая у вас компания?',
    answers: ['Услуги', 'Агентство', 'Производство', 'Образование', 'Другое'],
    reco: 'Сначала строим карту клиентского пути и определяем, где AI быстрее всего снимет нагрузку с команды.',
  },
  {
    question: 'Сколько сотрудников сейчас участвует в операционке?',
    answers: ['1–5', '6–20', '21–50', '50+'],
    reco: 'Чем больше участников процесса, тем важнее единая база знаний и автоматический контроль статусов.',
  },
  {
    question: 'Где больше всего теряется время?',
    answers: ['Ответы клиентам', 'Ручной ввод', 'Согласования', 'Поиск информации', 'Контроль задач'],
    reco: 'Это кандидат на AI-слой: классификация запросов, автозадачи, подсказки сотрудникам и маршрутизация.',
  },
  {
    question: 'Где больше всего теряются деньги?',
    answers: ['Потерянные заявки', 'Ошибки', 'Медленная обработка', 'Нет повторных продаж', 'Нет аналитики'],
    reco: 'Фокусируемся не на инструментах, а на узком месте, где автоматизация быстрее всего возвращает маржу.',
  },
  {
    question: 'Что хотите получить в первую очередь?',
    answers: ['Больше заявок', 'Автоматизация', 'AI-сотрудник', 'База знаний', 'Цифровая трансформация'],
    reco: 'Финальная рекомендация: начинать с AI-аудита процессов, затем собрать минимальный Business OS контур.',
  },
];
let currentQuestion = 0;
const chatAnswers = [];
function addMessage(text, type = 'ai') {
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.innerHTML = text;
  chatLog.append(message);
  chatLog.scrollTo({ top: chatLog.scrollHeight, behavior: 'smooth' });
}
function renderQuestion() {
  const item = consultation[currentQuestion];
  addMessage(item.question, 'ai');
  answerGrid.innerHTML = item.answers.map((answer) => `<button type="button">${answer}</button>`).join('');
  answerGrid.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.textContent;
      chatAnswers.push(value);
      addMessage(value, 'user');
      addMessage(item.reco, 'reco');
      currentQuestion += 1;
      if (currentQuestion < consultation.length) {
        answerGrid.innerHTML = '';
        setTimeout(renderQuestion, 520);
      } else {
        renderFinalReport();
      }
    });
  });
}
function renderFinalReport() {
  const company = chatAnswers[0] || 'компания';
  const size = chatAnswers[1] || 'команда';
  const loss = chatAnswers[3] || 'операционные потери';
  answerGrid.innerHTML = `
    <div class="lead-inputs">
      <input aria-label="Имя" placeholder="Ваше имя" />
      <input aria-label="Контакт" placeholder="Telegram или Email" />
      <button class="button primary magnetic" type="button">Получить аудит</button>
    </div>`;
  addMessage(`<strong>Предварительный вывод:</strong> ${company}, масштаб ${size}. Вероятная зона потерь: ${loss.toLowerCase()}. Ваш бизнес может терять 20–40 часов в месяц на ручных операциях, задержках и разрозненных знаниях. Рекомендую начать с карты процессов, AI-помощника для запросов и базы знаний как ядра цифровой операционной системы.`, 'reco');
}
addMessage('Я цифровой консультант. За 5 вопросов определю, где бизнес теряет скорость, деньги и управляемость.', 'ai');
renderQuestion();
