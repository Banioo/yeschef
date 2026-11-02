// ===== Hlavička: tmavé pozadí po odscrollování =====
const header = document.getElementById('top');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== Mobilní menu =====
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

function setMenu(open) {
  nav.classList.toggle('open', open);
  header.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
}
burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

// ===== Záložky menu =====
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.menu-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', t === tab);
    });
    panels.forEach(p => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
  });
});

// ===== Jemné vyjetí sekcí při scrollování =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion && 'IntersectionObserver' in window) {
  const items = document.querySelectorAll('.card, .about-media, .about-text, .gallery .ph, .steps li, .form, .dish');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(el => {
    // jen prvky pod první obrazovkou
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.classList.add('reveal');
      io.observe(el);
    }
  });
}

// ===== Světla v pozadí úvodu (vidět, dokud není nahraná fotka) =====
const canvas = document.getElementById('glow');
const ctx = canvas ? canvas.getContext('2d') : null;
let lights = [];

function resize() {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = r.width * dpr;
  canvas.height = r.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  lights = Array.from({ length: 26 }, () => ({
    x: r.width * (0.35 + Math.random() * 0.65),
    y: Math.random() * r.height,
    size: 20 + Math.random() * 70,
    alpha: 0.05 + Math.random() * 0.18,
    speed: 0.1 + Math.random() * 0.25,
    phase: Math.random() * Math.PI * 2
  }));
}

function draw(t) {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const H = canvas.getBoundingClientRect().height;
  lights.forEach(l => {
    const y = (l.y - t * 0.01 * l.speed) % (H + 100);
    const yy = y < -100 ? y + H + 200 : y;
    const a = l.alpha * (0.7 + 0.3 * Math.sin(t / 1500 + l.phase));
    const g = ctx.createRadialGradient(l.x, yy, 0, l.x, yy, l.size);
    g.addColorStop(0, `rgba(226, 185, 112, ${a})`);
    g.addColorStop(1, 'rgba(226, 185, 112, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(l.x, yy, l.size, 0, Math.PI * 2);
    ctx.fill();
  });
  requestAnimationFrame(draw);
}

if (canvas) {
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(draw);
}

// ===== Rok v patičce =====
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// ===== Poptávkový formulář =====
// POZOR: odesílání zatím není napojené. Před spuštěním webu napojit
// na službu pro formuláře (např. Formspree) nebo PHP skript na hostingu.
const form = document.getElementById('form');
const msg = document.getElementById('form-msg');

if (form) form.addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  ['f-name', 'f-email', 'f-type'].forEach(id => {
    const input = document.getElementById(id);
    const valid = input.value.trim() !== '' && input.checkValidity();
    input.closest('.field').classList.toggle('error', !valid);
    if (!valid) ok = false;
  });

  if (!ok) {
    msg.textContent = 'Vyplňte prosím jméno, platný e-mail a\u00a0typ akce.';
    return;
  }

  // Počet hostů: vaříme pro 1 až 200 osob
  const guests = document.getElementById('f-guests');
  if (guests && !guests.checkValidity()) {
    guests.closest('.field').classList.add('error');
    msg.textContent = 'Vaříme pro 1\u00a0až 200 osob. Upravte prosím počet hostů.';
    return;
  }
  if (guests) guests.closest('.field').classList.remove('error');
  // Až bude formulář napojený, změnit text na:
  // 'Děkujeme! Poptávku jsme přijali a brzy se vám ozveme.'
  msg.textContent = 'Ukázka: formulář zatím není napojený, poptávka se neodeslala.';
});

// ===== Video z YouTube: náhled, po kliknutí se spustí přehrávač =====
document.querySelectorAll('[data-yt]').forEach(box => {
  const id = box.dataset.yt;
  // nejdřív vlastní obrázek img/video.jpg (když existuje), jinak náhled z YouTube
  box.style.setProperty('--thumb', `url("img/video.jpg"), url("https://img.youtube.com/vi/${id}/hqdefault.jpg")`);
  const btn = box.querySelector('.video-play');
  if (!btn) return;

  // Když je stránka vložená v jiném okně (např. náhled), přehrávač YouTube se nenačte.
  // Tlačítko pak místo prázdného okna otevře video přímo na YouTube.
  let framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (framed) {
    const link = document.createElement('a');
    link.className = btn.className;
    link.href = `https://www.youtube.com/watch?v=${id}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', 'Přehrát video na YouTube');
    link.innerHTML = btn.innerHTML;
    btn.replaceWith(link);
    return;
  }

  btn.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    frame.title = 'Video YesChef';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    box.innerHTML = '';
    box.appendChild(frame);
  });
});
