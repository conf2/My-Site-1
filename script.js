const root = document.documentElement;
const glow = document.querySelector('.cursor-glow');
const canvas = document.getElementById('neural-canvas');
const ctx = canvas.getContext('2d');
let nodes = [];

function resizeCanvas() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  nodes = Array.from({ length: Math.min(92, Math.floor(innerWidth / 16)) }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    vx: (Math.random() - .5) * .35,
    vy: (Math.random() - .5) * .35,
  }));
}

function drawNetwork() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  nodes.forEach((node, index) => {
    node.x += node.vx; node.y += node.vy;
    if (node.x < 0 || node.x > innerWidth) node.vx *= -1;
    if (node.y < 0 || node.y > innerHeight) node.vy *= -1;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56,232,255,.7)';
    ctx.fill();
    for (let j = index + 1; j < nodes.length; j++) {
      const other = nodes[j];
      const distance = Math.hypot(node.x - other.x, node.y - other.y);
      if (distance < 145) {
        ctx.strokeStyle = `rgba(155,92,255,${(145 - distance) / 820})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(node.x, node.y); ctx.lineTo(other.x, other.y); ctx.stroke();
      }
    }
  });
  requestAnimationFrame(drawNetwork);
}

addEventListener('resize', resizeCanvas);
addEventListener('pointermove', (event) => {
  root.style.setProperty('--x', `${event.clientX}px`);
  root.style.setProperty('--y', `${event.clientY}px`);
  glow?.animate({ opacity: [0.55, 1] }, { duration: 260, fill: 'forwards' });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('visible'));
}, { threshold: 0.16 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

const output = document.getElementById('solution-output');
document.querySelectorAll('.solution-card').forEach((card) => {
  const activate = () => {
    document.querySelectorAll('.solution-card').forEach((item) => item.classList.remove('active'));
    card.classList.add('active');
    output.textContent = card.dataset.solution;
  };
  card.addEventListener('pointerenter', activate);
  card.addEventListener('click', activate);
});

const spinContent = {
  open: ['Коротко представиться: управление, digital, автоматизация и AI.', 'Объяснить принцип: сначала диагностика потерь, потом решение.', 'Согласовать формат разговора и право задавать вопросы.'],
  situation: ['Чем занимается бизнес и сколько человек в команде?', 'Через какие каналы приходят заявки?', 'Есть ли CRM и где ведётся база клиентов?', 'Какие процессы занимают больше всего времени?', 'Какие AI-инструменты уже пробовали?'],
  problem: ['Что в текущих процессах раздражает сильнее всего?', 'Где сотрудники чаще допускают ошибки?', 'Теряются ли заявки или сообщения?', 'Что вы автоматизировали бы в первую очередь?', 'Что тормозит рост бизнеса?'],
  impact: ['Сколько клиентов может теряться из-за долгого ответа?', 'Во сколько обходится потерянный клиент?', 'Сколько часов команда тратит на повторяющиеся действия?', 'Что будет, если процессы останутся такими же ещё год?'],
  need: ['Что изменится, если заявки будут распределяться автоматически?', 'Какой эффект даст сокращение рутины в 2 раза?', 'Упростит ли работу AI-поиск по базе знаний?', 'Что будет самым ценным результатом внедрения?'],
  close: ['Провести диагностику и собрать процессы.', 'Подготовить конкретный план внедрения.', 'Согласовать объём, сроки и стоимость.', 'Зафиксировать договорённости и начать работу.'],
};
const spinCard = document.getElementById('spin-card');
function renderSpin(key) {
  spinCard.innerHTML = `<h3>${document.querySelector(`[data-spin="${key}"]`).textContent}</h3><ul>${spinContent[key].map((item) => `<li>${item}</li>`).join('')}</ul>`;
}
document.querySelectorAll('[data-spin]').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('[data-spin]').forEach((item) => item.classList.remove('active'));
  tab.classList.add('active');
  renderSpin(tab.dataset.spin);
}));

const modal = document.getElementById('brief-modal');
document.querySelector('[data-open-brief]').addEventListener('click', () => modal.showModal());
document.querySelectorAll('.brief-options button').forEach((button) => button.addEventListener('click', () => {
  navigator.clipboard?.writeText(`AI для бизнеса. Узкое место: ${button.value}`);
}));

resizeCanvas();
drawNetwork();
renderSpin('open');
