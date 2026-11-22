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

// ===== Animované pozadí celého webu =====
// Velké zlaté a bronzové záře pomalu plují po stránce a nahoru stoupají drobné zlaté jiskry.
(function () {
  const textura = document.createElement('div');
  textura.className = 'bg-texture';
  textura.setAttribute('aria-hidden', 'true');
  document.body.prepend(textura);
  const cv = document.createElement('canvas');
  cv.className = 'bg-anim';
  cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const g = cv.getContext('2d');

  // barvy z palety: zlatá, bronz, šampaňská, grafit z loga
  // Každá stránka má jiné pozadí (jinou náladu), barvy jsou pořád z palety YesChef.
  // c = barva, a = síla, r = velikost, x/y = výchozí místo, sx/sy = rychlost pohybu
  const G = [198, 149, 61], B = [142, 101, 38], L = [226, 185, 112], S = [64, 64, 65], C = [233, 220, 194], R = [120, 52, 30];
  const nalady = {
    // Úvod: zlatá a bronzová záře ze stran (jako paleta)
    uvod:    { zaklad: '#161514', jiskry: 1,   barvaJisker: L, glows: [
      { c: G, a: .30, r: .55, x: .08, y: .18 }, { c: B, a: .32, r: .60, x: .92, y: .30 },
      { c: L, a: .16, r: .42, x: .70, y: .85 }, { c: S, a: .55, r: .70, x: .35, y: .55 }, { c: B, a: .22, r: .45, x: .15, y: .90 } ] },
    // Služby: teplá jantarová, jako světlo nad rautem
    sluzby:  { zaklad: '#1a1511', jiskry: 1.2, barvaJisker: L, glows: [
      { c: L, a: .26, r: .50, x: .50, y: .05 }, { c: G, a: .30, r: .55, x: .15, y: .60 },
      { c: B, a: .34, r: .60, x: .85, y: .70 }, { c: R, a: .18, r: .45, x: .60, y: .95 } ] },
    // O nás: klidný grafit s bronzem, jako dřevo a kov v kuchyni
    onas:    { zaklad: '#151515', jiskry: .6,  barvaJisker: C, glows: [
      { c: S, a: .70, r: .75, x: .30, y: .30 }, { c: B, a: .30, r: .55, x: .90, y: .15 },
      { c: G, a: .18, r: .45, x: .10, y: .85 }, { c: S, a: .50, r: .60, x: .75, y: .75 } ] },
    // Galerie: hluboká tma se silnou zlatou září uprostřed, jako bodové světlo
    galerie: { zaklad: '#100f0e', jiskry: 1.4, barvaJisker: L, glows: [
      { c: G, a: .34, r: .50, x: .50, y: .45 }, { c: L, a: .14, r: .35, x: .25, y: .20 },
      { c: B, a: .26, r: .50, x: .80, y: .85 } ] },
    // Video: kino – tma a pomalé světelné kužele ze stran
    video:   { zaklad: '#0f0e0d', jiskry: .5,  barvaJisker: C, glows: [
      { c: L, a: .20, r: .45, x: .00, y: .10 }, { c: L, a: .20, r: .45, x: 1.0, y: .10 },
      { c: S, a: .60, r: .70, x: .50, y: .70 }, { c: B, a: .22, r: .40, x: .50, y: 1.0 } ] },
    // Kontakt: světlá šampaňská, přívětivá
    kontakt: { zaklad: '#1b1917', jiskry: .8,  barvaJisker: C, glows: [
      { c: C, a: .12, r: .55, x: .75, y: .20 }, { c: G, a: .22, r: .50, x: .20, y: .40 },
      { c: S, a: .55, r: .65, x: .55, y: .80 } ] },
    // Poptávka: sytá zlatá, slavnostní
    poptavka:{ zaklad: '#18130d', jiskry: 1.6, barvaJisker: L, glows: [
      { c: G, a: .36, r: .60, x: .85, y: .25 }, { c: L, a: .20, r: .45, x: .15, y: .15 },
      { c: B, a: .34, r: .60, x: .30, y: .85 }, { c: R, a: .14, r: .40, x: .95, y: .90 } ] }
  };
  const soubor = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
  const mapa = { '': 'uvod', index: 'uvod', sluzby: 'sluzby', 'o-nas': 'onas', galerie: 'galerie', video: 'video', kontakt: 'kontakt', poptavka: 'poptavka' };
  const nalada = nalady[document.body.dataset.pozadi] || nalady[mapa[soubor]] || nalady.uvod;
  const glows = nalada.glows.map((o, i) => Object.assign({
    sx: .00006 + (i % 3) * .00003, sy: .00007 + ((i + 1) % 3) * .00002, p: i * 1.3
  }, o));
  let W = 0, H = 0, sparks = [];
  const SCALE = 0.5; // pozadí je rozmazané, stačí nižší rozlišení = rychlejší

  function size() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * SCALE); cv.height = Math.round(H * SCALE);
    const n = Math.round(Math.min(80, (W * H) / 26000 * nalada.jiskry));
    sparks = Array.from({ length: n }, () => newSpark(true));
  }
  function newSpark(anywhere) {
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 10,
      r: .6 + Math.random() * 1.8,
      v: .15 + Math.random() * .45,
      d: (Math.random() - .5) * .25,
      a: .25 + Math.random() * .55,
      t: Math.random() * Math.PI * 2
    };
  }

  let last = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    if (document.hidden || t - last < 33) return; // cca 30 snímků za sekundu
    last = t;
    g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    // pod animací je Michaelovo vlastní pozadí (img/pozadi.webp), tady jen jemný barevný nádech stránky
    g.clearRect(0, 0, W, H);
    g.globalAlpha = .12;
    g.fillStyle = nalada.zaklad;
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 1;

    const big = Math.max(W, H);
    g.globalCompositeOperation = 'lighter';
    glows.forEach(o => {
      const x = (o.x + Math.sin(t * o.sx + o.p) * .18) * W;
      const y = (o.y + Math.cos(t * o.sy + o.p) * .15) * H;
      const r = o.r * big * (0.9 + 0.1 * Math.sin(t * .0004 + o.p));
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${o.c},${o.a})`);
      gr.addColorStop(1, `rgba(${o.c},0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
    });

    sparks.forEach((s, i) => {
      s.y -= s.v; s.x += s.d + Math.sin(t * .001 + s.t) * .15;
      if (s.y < -10) sparks[i] = newSpark(false);
      const tw = s.a * (.6 + .4 * Math.sin(t * .003 + s.t));
      g.fillStyle = `rgba(${nalada.barvaJisker},${tw})`;
      g.beginPath(); g.arc(s.x, s.y, s.r, 0, Math.PI * 2); g.fill();
    });
    g.globalCompositeOperation = 'source-over';
  }

  size();
  window.addEventListener('resize', size);
  requestAnimationFrame(frame);
})();

// ===== Plovoucí ilustrace jídla (Michaelovy obrázky) =====
// Obrázky jsou ve složce img/jidlo. Tady se nastavuje, kde které jsou:
// x a y = pozice v procentech sekce, s = velikost v px, r = natočení, d = hloubka
// (1 = blízko, ostré; 2 = dál, menší a rozmazané), m = 0 znamená na mobilu skrýt.
(function () {
  const sady = {
    '#yeschef':  [
      { f: 'pizza',     x: 2,  y: 8,  s: 170, r: -18, d: 1 },
      { f: 'rajce2',    x: 88, y: 6,  s: 130, r: 12,  d: 1 },
      { f: 'zampion',   x: 93, y: 88, s: 90,  r: 20,  d: 2, m: 0 },
      { f: 'listy',     x: 3,  y: 86, s: 110, r: 30,  d: 2, m: 0 }
    ],
    '#vitejte':  [
      { f: 'papriky2',  x: 90, y: 4,  s: 130, r: 14,  d: 2 },
      { f: 'salam',     x: 46, y: 82, s: 80,  r: -25, d: 2, m: 0 }
    ],
    '#postup':   [
      { f: 'hranolky1', x: 3,  y: 12, s: 150, r: -10, d: 1 },
      { f: 'hamburg',   x: 92, y: 78, s: 120, r: 8,   d: 2, m: 0 }
    ],
    '.page-hero:not(.page-hero-photo)': [
      { f: 'rajce',     x: 78, y: 22, s: 150, r: 10,  d: 1 },
      { f: 'listy',     x: 90, y: 58, s: 120, r: -20, d: 2, m: 0 },
      { f: 'paprika',   x: 66, y: 64, s: 90,  r: 25,  d: 2, m: 0 }
    ],
    '.cta-page': [
      { f: 'pizza',     x: 2,  y: 70, s: 130, r: 20,  d: 2, m: 0 },
      { f: 'zampion',   x: 40, y: 6,  s: 80,  r: -15, d: 2, m: 0 }
    ],
    '#zkusenosti': [
      { f: 'papriky1',  x: 92, y: 4,  s: 110, r: -12, d: 2, m: 0 }
    ],
    '#galerie':  [
      { f: 'parekvrohliku', x: 88, y: 6, s: 120, r: -8, d: 2, m: 0 }
    ]
  };

  const prvky = [];
  Object.entries(sady).forEach(([sel, polozky]) => {
    document.querySelectorAll(sel).forEach(sekce => {
      sekce.classList.add('has-deco');
      const vrstva = document.createElement('div');
      vrstva.className = 'deco';
      vrstva.setAttribute('aria-hidden', 'true');
      polozky.forEach((p, i) => {
        const obal = document.createElement('span');
        obal.className = 'deco-item deco-d' + (p.d || 1) + (p.m === 0 ? ' deco-hide-m' : '');
        obal.style.left = p.x + '%';
        obal.style.top = p.y + '%';
        obal.style.setProperty('--s', p.s + 'px');
        const img = document.createElement('img');
        img.src = 'img/jidlo/' + p.f + '.webp';
        img.alt = '';
        img.loading = 'lazy';
        img.style.setProperty('--r', (p.r || 0) + 'deg');
        img.style.animationDuration = (7 + ((i * 1.7) % 5)) + 's';
        img.style.animationDelay = (-i * 1.3) + 's';
        obal.appendChild(img);
        vrstva.appendChild(obal);
        prvky.push({ el: obal, sekce, rychlost: p.d === 2 ? .06 : .14 });
      });
      sekce.prepend(vrstva);
    });
  });

  // Parallax: při scrollování se ilustrace posouvají jinou rychlostí než text
  let ceka = false;
  function posun() {
    ceka = false;
    const vh = window.innerHeight;
    prvky.forEach(o => {
      const r = o.sekce.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const stred = r.top + r.height / 2 - vh / 2;
      o.el.style.transform = `translate3d(0, ${(-stred * o.rychlost).toFixed(1)}px, 0)`;
    });
  }
  window.addEventListener('scroll', () => { if (!ceka) { ceka = true; requestAnimationFrame(posun); } }, { passive: true });
  window.addEventListener('resize', posun);
  posun();
})();
