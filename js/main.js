const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
// phones change height as the address bar slides; don't recalculate every animation when that happens
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 640px)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const nav = $('#nav');

// ---------- smooth scroll (mouse only; phones keep their own native touch scrolling) ----------
let lenis = null;
if (!reduce && Lenis && finePointer) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
const scrollToEl = el => lenis ? lenis.scrollTo(el, { offset: -10, duration: 1.6 }) : el.scrollIntoView({ behavior: 'smooth' });
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  const el = id.length > 1 && document.querySelector(id);
  if (!el) return;
  e.preventDefault();
  nav.classList.remove('open');
  scrollToEl(el);
}));
$('#burger').onclick = () => nav.classList.toggle('open');

// anything with data-svc preselects the enquiry type
$$('[data-svc]').forEach(a => a.addEventListener('click', () => {
  const r = document.querySelector(`input[name=svc][value="${a.dataset.svc}"]`);
  if (r) r.checked = true;
}));

// ---------- text splitting ----------
function splitChars(el) {
  const chars = [];
  const walk = node => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          for (const ch of part) { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; w.append(c); chars.push(c); }
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    }
  };
  walk(el);
  return chars;
}
function splitWords(el) {
  const words = [];
  const walk = node => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span'); w.className = 'wd'; w.textContent = part; frag.append(w); words.push(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    }
  };
  walk(el);
  return words;
}

// ---------- reviews (built here so the two rows can loop seamlessly) ----------
const reviews = [
  ['Ashoka Properties provided excellent guidance throughout my property search. The team was professional, helpful and transparent.', 'Rajesh Kumar', 'Property Buyer'],
  ['I was looking for a property in Jindal Global City and Ashoka Properties helped me find suitable options according to my requirements and budget.', 'Amit Sharma', 'Home Buyer'],
  ['The team made the property selling process simple and convenient. Their communication and professional approach were really appreciated.', 'Sunil Verma', 'Property Owner'],
  ['Ashoka Properties helped us understand the property options clearly and guided us throughout the purchase process. A reliable property consultancy.', 'Pankaj Gupta', 'Property Investor'],
  ['From property selection to final documentation, the team provided helpful assistance. The overall experience was smooth and professional.', 'Neeraj Singh', 'Property Client'],
  ['A professional and customer-focused property consultancy. Ashoka Properties made our property experience much easier with their guidance.', 'Manoj Aggarwal', 'Property Client'],
];
const revCard = ([q, n, r]) => `<article class="rev"><div class="stars">★★★★★</div><q>${q}</q><div class="who"><div class="av">${n.split(' ').map(s => s[0]).join('')}</div><div><b>${n}</b><span>${r}</span></div></div></article>`;
const rowA = reviews.slice(0, 3).concat(reviews.slice(3)).map(revCard).join('');
const rowB = reviews.slice(3).concat(reviews.slice(0, 3)).map(revCard).join('');
$('#revs').innerHTML = `<div class="row">${rowA + rowA}</div><div class="row rev2">${rowB + rowB}</div>`;

// ---------- form -> WhatsApp ----------
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const v = id => document.getElementById(id).value.trim();
  const svc = document.querySelector('input[name=svc]:checked').value;
  const text = `Hello Ashoka Properties,\nName: ${v('name')}\nPhone: ${v('phone')}\nInterested in: ${svc}\n${v('msg')}`;
  window.open('https://wa.me/919350974852?text=' + encodeURIComponent(text), '_blank');
});

// ---------- 3D scene ----------
let scene = null, introPlayed = false;
const wait = ms => new Promise(r => setTimeout(r, ms));
const sceneReady = import('./scene.js')
  .then(m => {
    scene = m.createScene($('#scene'), { mobile });
    // 3D arrived after the intro already ran (slow network): fly the camera in now
    if (introPlayed) gsap.to({ v: 0 }, { v: 1, duration: 2.4, ease: 'power3.out', onUpdate() { scene.setIntro(this.targets()[0].v); } });
  })
  .catch(err => { console.warn('3D unavailable, using photo instead', err); document.documentElement.classList.add('no-webgl'); });

if (finePointer) addEventListener('pointermove', e => scene?.setPointer(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));
else if (!reduce) gsap.ticker.add(t => scene?.setPointer(Math.sin(t * 0.35) * 0.35, Math.cos(t * 0.25) * 0.15));

// ---------- preloader + intro ----------
const heroChars = splitChars($('#heroTitle'));
gsap.set(heroChars, { yPercent: 115, rotateX: -80, opacity: 0 });
gsap.set('.hero-in', { y: 30, opacity: 0 });

const count = { v: 0 };
gsap.to('#loader img', { opacity: 1, scale: 1, rotateY: 0, duration: 1.1, ease: 'expo.out', delay: 0.1 });
gsap.to('#loader .tag', { opacity: 1, duration: 0.8, delay: 0.5 });
const counting = gsap.to(count, { v: 90, duration: 1.6, ease: 'power2.out', onUpdate: () => { $('#loadNum').textContent = Math.round(count.v); gsap.set('#loadBar', { scaleX: count.v / 100 }); } });

// never hold the loading screen for long: on slow mobile data the 3D keeps loading behind the page
Promise.all([Promise.race([sceneReady, wait(mobile ? 2500 : 4500)]), Promise.race([document.fonts?.ready, wait(1500)]), wait(reduce ? 0 : 1300)]).then(() => {
  introPlayed = true;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to(count, { v: 100, duration: 0.4, ease: 'power1.out', onUpdate: () => { $('#loadNum').textContent = Math.round(count.v); gsap.set('#loadBar', { scaleX: count.v / 100 }); } }, counting.isActive() ? '+=0' : 0)
    .to('#loader .mid', { y: -40, opacity: 0, duration: 0.6, ease: 'power2.in' })
    .to('#loader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '<0.2')
    .add(() => { document.body.classList.remove('loading'); lenis?.start(); $('#loader').style.display = 'none'; })
    .to({ v: 0 }, { v: 1, duration: reduce ? 0.01 : 2.8, ease: 'power3.out', onUpdate() { scene?.setIntro(this.targets()[0].v); } }, '<-0.6')
    .to(heroChars, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.4, stagger: 0.035 }, '<0.3')
    .to('.hero-in', { y: 0, opacity: 1, duration: 1.2, stagger: 0.1 }, '<0.4');
});

if (!reduce) {
  // ---------- hero: pinned, scroll orbits the camera around the villa ----------
  // one timeline on the pin, so the headline fades while the camera orbits (duration 1 = whole pin)
  // phones don't pin the hero (pinning fights touch scrolling); the camera still orbits as the hero scrolls away
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: mobile ? 'bottom top' : '+=120%', pin: !mobile, scrub: mobile ? 0.5 : true, onUpdate: s => scene?.setProgress(s.progress) } })
    .to('#heroCopy', { y: -120, opacity: 0, scale: 0.92, ease: 'none', duration: 0.45 }, 0)
    .to('.hero-foot', { y: 60, opacity: 0, ease: 'none', duration: 0.25 }, 0)
    .to({}, { duration: 0.55 });
  ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'top top', onToggle: () => {}, onLeave: () => scene?.setRunning(false), onEnterBack: () => scene?.setRunning(true) });

  // nav hides on scroll down, returns on scroll up
  ScrollTrigger.create({ onUpdate: s => nav.classList.toggle('hide', s.direction === 1 && s.scroll() > 300 && !nav.classList.contains('open')) });

  // ---------- marquee speeds up and flips with scroll ----------
  const mq = gsap.to('#marquee', { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
  ScrollTrigger.create({ onUpdate: s => {
    gsap.to(mq, { timeScale: (s.direction || 1) * (1 + Math.min(Math.abs(s.getVelocity()) / 300, 5)), duration: 0.3, overwrite: true });
    gsap.to(mq, { timeScale: s.direction || 1, duration: 1.2, delay: 0.3 });
  } });

  // ---------- statement: words light up as you scroll ----------
  gsap.to(splitWords($('#statement')), { opacity: 1, stagger: 0.06, ease: 'none', scrollTrigger: { trigger: '#statement', start: 'top 82%', end: 'bottom 45%', scrub: true } });

  // ---------- generic 3D reveals ----------
  gsap.set('[data-r="up"]', { y: 90, rotateX: -28, opacity: 0, transformPerspective: 900, transformOrigin: '50% 100%' });
  ScrollTrigger.batch('[data-r="up"]', { start: 'top 90%', once: true, onEnter: b => gsap.to(b, { y: 0, rotateX: 0, opacity: 1, duration: 1.3, ease: 'expo.out', stagger: 0.1 }) });
  $$('[data-r="clip"]').forEach(el => gsap.fromTo(el,
    { clipPath: 'inset(16% 14% 16% 14% round 40px)', scale: 0.94 },
    { clipPath: 'inset(0% 0% 0% 0% round 32px)', scale: 1, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } }));
  $$('[data-parallax]').forEach(img => gsap.fromTo(img, { yPercent: -9 }, { yPercent: 9, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // ---------- services ----------
  const cards = $$('#hsTrack .card');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 641px)', () => {
    const track = $('#hsTrack');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const tilt = () => {
      const cx = innerWidth / 2;
      cards.forEach(c => {
        const r = c.getBoundingClientRect();
        const d = gsap.utils.clamp(-1.2, 1.2, (r.left + r.width / 2 - cx) / innerWidth);
        gsap.set(c, { rotateY: d * -42, z: -Math.abs(d) * 260, rotateZ: d * -2.5, transformPerspective: 1200 });
      });
    };
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '#services', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, onUpdate: tilt, onRefresh: tilt } });
    tilt();
  });
  mm.add('(max-width: 640px)', () => {
    cards.forEach(c => gsap.from(c, { y: 120, rotateX: -35, opacity: 0, transformPerspective: 900, transformOrigin: '50% 100%', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 92%', once: true } }));
  });

  // ---------- why: cards flip down in 3D ----------
  gsap.from('#whyGrid > div', { rotateX: -95, opacity: 0, transformPerspective: 1000, transformOrigin: '50% 0%', stagger: 0.14, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '#whyGrid', start: 'top 82%', once: true } });

  // ---------- about: logo card floats in 3D ----------
  gsap.fromTo('#logoCard', { y: 90, rotateY: -30, rotateX: 18 }, { y: -40, rotateY: 12, rotateX: -6, ease: 'none', scrollTrigger: { trigger: '.about-media', start: 'top bottom', end: 'bottom top', scrub: true } });

  // ---------- process rail draws itself ----------
  gsap.to('#rail', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#steps', start: 'top 70%', end: 'bottom 60%', scrub: true } });

  // ---------- gallery: tilted 3D wall straightens out ----------
  // phones get a gentler tilt that settles sooner, so photos don't overlap on a narrow screen
  const k = mobile ? 0.4 : 1;
  const wallEnd = mobile ? 'top 35%' : 'center 55%';
  const depths = [-220, 160, -90, 260, -160, 110, -260, 70, 190];
  gsap.fromTo('#wall', { rotateX: 52 * k, rotateZ: -12 * k, scale: 1 - 0.26 * k, yPercent: -4 * k }, { rotateX: 0, rotateZ: 0, scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.wall', start: 'top 90%', end: wallEnd, scrub: true } });
  gsap.fromTo('#wall figure', { z: i => depths[i % depths.length] * k }, { z: 0, ease: 'none', scrollTrigger: { trigger: '.wall', start: 'top 90%', end: wallEnd, scrub: true } });

  // ---------- CTA logo + footer letters ----------
  gsap.fromTo('#ctaMark', { rotate: -18, y: 80 }, { rotate: 12, y: -40, ease: 'none', scrollTrigger: { trigger: '.cta-band', start: 'top bottom', end: 'bottom top', scrub: true } });
  const fb = $('#fbig'); fb.innerHTML = [...fb.textContent].map(c => `<span>${c}</span>`).join('');
  gsap.from('#fbig span', { yPercent: 110, rotateX: -70, transformPerspective: 600, stagger: 0.06, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '#fbig', start: 'top 95%', once: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
}

// ---------- custom cursor + magnetic buttons (mouse only) ----------
if (finePointer && !reduce) {
  const dot = $('#cursor'), ring = $('#cursorRing'), label = ring.querySelector('span');
  const dx = gsap.quickTo(dot, 'x', { duration: 0.12 }), dy = gsap.quickTo(dot, 'y', { duration: 0.12 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  addEventListener('pointermove', e => { document.body.classList.add('has-cursor'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
  document.addEventListener('pointerleave', () => document.body.classList.remove('has-cursor'));
  $$('[data-cursor]').forEach(el => {
    el.addEventListener('pointerenter', () => { label.textContent = el.dataset.cursor; ring.classList.add('big'); });
    el.addEventListener('pointerleave', () => ring.classList.remove('big'));
  });
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.4, ease: 'power3' });
    });
    btn.addEventListener('pointerleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,.4)' }));
  });
  const card = $('#logoCard'), media = $('.about-media');
  media.addEventListener('pointermove', e => {
    const r = media.getBoundingClientRect();
    gsap.to(card.querySelector('img'), { x: ((e.clientX - r.left) / r.width - 0.5) * 24, y: ((e.clientY - r.top) / r.height - 0.5) * 24, duration: 0.6 });
  });
} else {
  $('#cursor').remove(); $('#cursorRing').remove();
}
