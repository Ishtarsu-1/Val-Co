// Atelier Val & Co — interactions (voir DESIGN.md §7)

// Adresse de la boutique en ligne (Shopify, Etsy…). À remplacer par la vraie URL.
const SHOP_URL = 'https://atelier-valandco.myshopify.com';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover)').matches;

// Liens boutique : data-shop="/products/xxx" → SHOP_URL + chemin
document.querySelectorAll('[data-shop]').forEach(a => {
  a.href = SHOP_URL + (a.dataset.shop || '');
  a.target = '_blank';
  a.rel = 'noopener';
});

// Navigation
const nav = document.querySelector('.nav');
const toggle = document.querySelector('.nav__toggle');
const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 40);
onScroll();
addEventListener('scroll', onScroll, { passive: true });
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
document.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('is-open');
  toggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}));
addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) toggle.click(); });

// Titres découpés mot par mot
document.querySelectorAll('.split').forEach(el => {
  el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
  el.innerHTML = el.textContent.trim().split(/\s+/)
    .map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
});

// Révélations au scroll
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -12% 0px' });
document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

// Contenu modifiable par la cliente via /admin (data/*.json)
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const safeUrl = u => (/^(https?:\/\/|\/|assets\/)/.test(u || '') ? u : ''); // bloque javascript: & co
const loadJSON = async url => {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url} : ${res.status}`);
  return res.json();
};
const renderInto = async (el, url, build) => {
  if (!el) return;
  try {
    el.innerHTML = build(await loadJSON(url));
    el.querySelectorAll('[data-reveal]').forEach((n, i) => { n.style.setProperty('--d', `${(i % 3) * 100}ms`); io.observe(n); });
  } catch (err) {
    console.error(err);
    el.innerHTML = '<p class="lead">Le contenu n’a pas pu être chargé. Réessayez dans un instant.</p>';
  }
};

renderInto(document.querySelector('#produits'), 'data/produits.json', ({ produits = [] }) => produits.map(p => `
  <article class="product" data-cat="${esc(p.categorie)}" data-reveal>
    <div class="product__img">${p.badge ? `<span class="tag">${esc(p.badge)}</span>` : ''}<img src="${esc(safeUrl(p.image))}" alt="${esc(p.alt || p.nom)}" loading="lazy"></div>
    <div class="product__body">
      <h3>${esc(p.nom)}</h3>
      <p>${esc(p.description)}</p>
      <div class="product__foot"><span class="price">${esc(p.prix)}</span><a class="btn" href="${esc(safeUrl(p.lien) || SHOP_URL)}" target="_blank" rel="noopener">Voir</a></div>
    </div>
  </article>`).join(''));

renderInto(document.querySelector('#galerie'), 'data/galerie.json', ({ photos = [] }) => photos.map(ph => `
  <figure data-reveal><img src="${esc(safeUrl(ph.image))}" alt="${esc(ph.alt || ph.legende)}" loading="lazy">${ph.legende ? `<figcaption>${esc(ph.legende)}</figcaption>` : ''}</figure>`).join(''));

// Parallaxe légère (rAF)
const parallax = [...document.querySelectorAll('[data-parallax]')];
if (!reduced && parallax.length) {
  let ticking = false;
  const update = () => {
    parallax.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      el.style.transform = `translate3d(0, ${(p * -(+el.dataset.parallax || 40)).toFixed(1)}px, 0)`;
    });
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

if (canHover && !reduced) {
  // Boutons magnétiques
  document.querySelectorAll('.magnet').forEach(el => {
    let raf;
    el.addEventListener('pointermove', e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
    });
    el.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); el.style.transform = ''; });
  });
  // Halo qui suit la souris sur les cartes univers
  document.querySelectorAll('.path').forEach(el => {
    let raf;
    el.addEventListener('pointermove', e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  });
}

// Filtres produits
const filters = document.querySelectorAll('.filter');
filters.forEach(btn => btn.addEventListener('click', () => {
  filters.forEach(b => b.setAttribute('aria-pressed', b === btn));
  const cat = btn.dataset.filter;
  document.querySelectorAll('.product').forEach(p => {
    p.hidden = cat !== 'all' && p.dataset.cat !== cat;
  });
}));

// Formulaire de contact (Formspree) — envoi sans recharger la page
const form = document.querySelector('#contact-form');
if (form) {
  const sujet = new URLSearchParams(location.search).get('sujet');
  if (sujet && form.sujet.querySelector(`option[value="${CSS.escape(sujet)}"]`)) form.sujet.value = sujet;

  const status = form.querySelector('.form__status');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form._gotcha.value) return; // robot
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    status.className = 'form__status';
    status.textContent = 'Envoi en cours…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      status.textContent = 'Merci ! Votre message est bien parti, je vous réponds très vite.';
    } catch {
      status.classList.add('is-error');
      status.textContent = 'Oups, l’envoi a échoué. Réessayez ou écrivez-moi directement par e-mail.';
    } finally {
      btn.disabled = false;
    }
  });
}

// Petit cœur du footer : il fait tomber des pétales
document.querySelectorAll('.heart').forEach(h => {
  const bloom = () => {
    if (reduced || h.dataset.busy) return;
    h.dataset.busy = 1;
    for (let i = 0; i < 9; i++) {
      const p = document.createElement('span');
      p.className = 'petal';
      const a = (Math.PI * 2 * i) / 9;
      p.style.setProperty('--x', `${Math.cos(a) * (30 + Math.random() * 30)}px`);
      p.style.setProperty('--y', `${Math.sin(a) * 30 - 30 - Math.random() * 30}px`);
      p.style.setProperty('--r', `${Math.random() * 360}deg`);
      h.append(p);
      setTimeout(() => p.remove(), 1500);
    }
    setTimeout(() => delete h.dataset.busy, 1500);
  };
  h.addEventListener('mouseenter', bloom);
  h.addEventListener('click', bloom);
});

document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
