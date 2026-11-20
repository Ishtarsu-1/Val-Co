// node --test test/ — vérifie l'API de l'admin sur une copie temporaire du site
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'valco-'));
fs.mkdirSync(path.join(tmp, 'data'));
fs.writeFileSync(path.join(tmp, 'data/produits.json'), '{"produits":[]}');
fs.writeFileSync(path.join(tmp, 'index.html'), 'ok');
process.env.SITE_ROOT = tmp;
const { server } = require('../server.js');

let base;
before(() => new Promise(r => server.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${server.address().port}`; r(); })));
after(() => { server.close(); fs.rmSync(tmp, { recursive: true }); });

const produit = { nom: 'Bougie', prix: '24 €', categorie: 'bougies', image: 'assets/uploads/x.jpg', description: 'd', lien: '' };

test('enregistre une liste de produits valide', async () => {
  const res = await fetch(base + '/api/produits', { method: 'PUT', body: JSON.stringify({ produits: [{ ...produit, pirate: 1 }] }) });
  assert.equal(res.status, 200);
  const saved = JSON.parse(fs.readFileSync(path.join(tmp, 'data/produits.json')));
  assert.equal(saved.produits[0].nom, 'Bougie');
  assert.equal(saved.produits[0].pirate, undefined); // champs inconnus ignorés
});

test('refuse un produit invalide sans toucher au fichier', async () => {
  for (const bad of [{ ...produit, nom: '' }, { ...produit, categorie: 'x' }, { ...produit, lien: 'javascript:alert(1)' }, { ...produit, image: '../server.js' }]) {
    const res = await fetch(base + '/api/produits', { method: 'PUT', body: JSON.stringify({ produits: [bad] }) });
    assert.equal(res.status, 400);
  }
  assert.equal(JSON.parse(fs.readFileSync(path.join(tmp, 'data/produits.json'))).produits[0].nom, 'Bougie');
});

test('upload : accepte une vraie image, refuse le reste', async () => {
  const png = Buffer.from('89504e470d0a1a0a0000', 'hex');
  const ok = await fetch(base + '/api/upload', { method: 'POST', body: png });
  assert.equal(ok.status, 201);
  const { image } = await ok.json();
  assert.match(image, /^assets\/uploads\/[\w-]+\.png$/);
  assert.ok(fs.existsSync(path.join(tmp, image)));
  const bad = await fetch(base + '/api/upload', { method: 'POST', body: '<script>alert(1)</script>' });
  assert.equal(bad.status, 400);
});

test('refuse les écritures venant d’un autre site', async () => {
  const res = await fetch(base + '/api/produits', { method: 'PUT', headers: { Origin: 'https://pirate.example' }, body: JSON.stringify({ produits: [] }) });
  assert.equal(res.status, 403);
});

test('sert les fichiers JSON tels quels', async () => {
  assert.ok(Array.isArray((await (await fetch(base + '/data/produits.json')).json()).produits));
});

test('ne sert ni le code serveur ni hors du dossier', async () => {
  assert.equal((await fetch(base + '/')).status, 200);
  for (const p of ['/server.js', '/package.json', '/%2e%2e/etc/passwd', '/.git/config'])
    assert.equal((await fetch(base + p)).status, 404, p);
});
