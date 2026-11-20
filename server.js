// Serveur du site + API de l'admin (/admin). Node ≥ 18, aucune dépendance.
// Lancer : node server.js   (PORT=8765 par défaut)
const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(process.env.SITE_ROOT || __dirname);
const PORT = +process.env.PORT || 8765;
const HOST = process.env.HOST || '127.0.0.1';
const UPLOADS = path.join(ROOT, 'assets', 'uploads');
const CATEGORIES = ['bougies', 'deco', 'mariage', 'cadeaux'];
const MAX_UPLOAD = 8 * 1024 * 1024;

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

// shortcut: pas d'authentification → le serveur refuse d'écouter hors de la machine locale.
// Au déploiement : ajouter la connexion par code envoyé par e-mail dans isAllowed().
if (!['127.0.0.1', 'localhost', '::1'].includes(HOST)) {
  console.error('Admin sans authentification : HOST doit rester local tant que la connexion par e-mail n’est pas en place.');
  process.exit(1);
}
const isAllowed = () => true;

// ---------- validation ----------
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const okImage = s => (/^assets\/[\w\-./]+$/.test(s) && !s.includes('..')) || /^https:\/\/\S+$/.test(s);
const okLink = s => s === '' || /^https:\/\/\S+$/.test(s);

function cleanProduits(body) {
  if (!Array.isArray(body?.produits) || body.produits.length > 300) throw new Error('Liste de produits invalide');
  return { produits: body.produits.map((p, i) => {
    const o = { nom: str(p.nom, 120), description: str(p.description, 600), prix: str(p.prix, 40),
      categorie: str(p.categorie, 20), badge: str(p.badge, 40), image: str(p.image, 500), alt: str(p.alt, 200), lien: str(p.lien, 500) };
    if (!o.nom) throw new Error(`Produit n°${i + 1} : le nom est obligatoire`);
    if (!okImage(o.image)) throw new Error(`« ${o.nom} » : photo manquante`);
    if (!CATEGORIES.includes(o.categorie)) throw new Error(`« ${o.nom} » : catégorie inconnue`);
    if (!okLink(o.lien)) throw new Error(`« ${o.nom} » : le lien doit commencer par https://`);
    return o;
  }) };
}

function cleanGalerie(body) {
  if (!Array.isArray(body?.photos) || body.photos.length > 300) throw new Error('Liste de photos invalide');
  return { photos: body.photos.map((ph, i) => {
    const o = { image: str(ph.image, 500), legende: str(ph.legende, 120), alt: str(ph.alt, 200) };
    if (!okImage(o.image)) throw new Error(`Photo n°${i + 1} invalide`);
    return o;
  }) };
}

// vrai format d'image d'après les premiers octets (on ne fait pas confiance au nom du fichier)
function imageExt(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return '.jpg';
  if (buf.subarray(0, 4).toString('hex') === '89504e47') return '.png';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return '.webp';
  return null;
}

async function writeJSON(rel, data) {
  const file = path.join(ROOT, rel);
  await fs.writeFile(file + '.tmp', JSON.stringify(data, null, 2) + '\n');
  await fs.rename(file + '.tmp', file); // écriture atomique : pas de fichier à moitié écrit
}

// ---------- http ----------
const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(Buffer.isBuffer(body) || typeof body === 'string' ? body : JSON.stringify(body));
};

async function readBody(req, limit) {
  const chunks = []; let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Object.assign(new Error('Fichier trop lourd (8 Mo max)'), { status: 413 });
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

async function api(req, res, url) {
  if (!isAllowed(req)) return send(res, 401, { error: 'Non connecté' });
  // bloque les requêtes envoyées depuis un autre site (CSRF)
  const origin = req.headers.origin;
  if (req.method !== 'GET' && origin && new URL(origin).host !== req.headers.host) return send(res, 403, { error: 'Origine refusée' });

  if (req.method === 'PUT' && url.pathname === '/api/produits') {
    const data = cleanProduits(JSON.parse(await readBody(req, 1e6)));
    await writeJSON('data/produits.json', data); return send(res, 200, data);
  }
  if (req.method === 'PUT' && url.pathname === '/api/galerie') {
    const data = cleanGalerie(JSON.parse(await readBody(req, 1e6)));
    await writeJSON('data/galerie.json', data); return send(res, 200, data);
  }
  if (req.method === 'POST' && url.pathname === '/api/upload') {
    const buf = await readBody(req, MAX_UPLOAD);
    const ext = imageExt(buf);
    if (!ext) return send(res, 400, { error: 'Format non reconnu : utilisez une photo JPG, PNG ou WEBP' });
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;
    await fs.mkdir(UPLOADS, { recursive: true });
    await fs.writeFile(path.join(UPLOADS, name), buf);
    return send(res, 201, { image: `assets/uploads/${name}` });
  }
  send(res, 404, { error: 'Inconnu' });
}

async function serveStatic(res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, rel);
  // reste dans le dossier du site ; ni fichiers cachés, ni code serveur, ni tests
  if (!file.startsWith(ROOT + path.sep) || /(^|[\\/])\./.test(rel) || /^\/(server|package)/.test(rel) || rel.startsWith('/test/'))
    return send(res, 404, 'Introuvable', 'text/plain; charset=utf-8');
  try {
    send(res, 200, await fs.readFile(file), TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
  } catch { send(res, 404, 'Introuvable', 'text/plain; charset=utf-8'); }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Méthode refusée', 'text/plain; charset=utf-8');
    await serveStatic(res, url);
  } catch (err) {
    // erreurs de validation / JSON → 400 avec un message lisible par la cliente
    send(res, err.status || 400, { error: err instanceof SyntaxError ? 'Données illisibles' : err.message });
  }
});

if (require.main === module) server.listen(PORT, HOST, () => console.log(`Site : http://localhost:${PORT}   Admin : http://localhost:${PORT}/admin/`));
module.exports = { server, cleanProduits, cleanGalerie, imageExt };
