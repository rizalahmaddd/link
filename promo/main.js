(async () => {
await document.fonts.ready;
const mg = MG.create({ width: 1920, height: 1080, duration: 30, fps: 30 });
const { tl, sfx, $, $$ } = mg;

const URL_LONG = 'https://tokoku.id/produk/kategori/baju-koko-pria-lengan-panjang-putih-ukuran-xl?utm_source=instagram&utm_campaign=ramadan';
const DEMO = 'https://link.solusikoding.com';
const FS = [4.6, 9.5, 14.4, 19.3];
const T = { logo: 2.8, feat: 4.6, cta: 24.0, end: 30 };

const HEADS = [
  { chip: 'DESKTOP', title: 'Tempel. Enter. <em>Jadi.</em>', sub: 'Tautan pendek langsung tersalin ke clipboard.' },
  { chip: 'MOBILE', title: 'Sponsor dulu, <em>baru tujuan.</em>', sub: 'Foto atau video YouTube, bisa dilewati atau wajib ditonton.' },
  { chip: 'DESKTOP + HP', title: 'Klien lihat <em>hasilnya.</em>', sub: 'Tanpa login. Cukup bagikan satu tautan laporan.' },
  { chip: 'DESKTOP + HP', title: 'Kunci. Batasi. <em>Cetak QR.</em>', sub: 'PIN, kedaluwarsa, batas klik, dan QR siap cetak.' },
];
HEADS.forEach((h, i) => {
  const el = document.createElement('div');
  el.className = 'fh'; el.id = 'fh' + i;
  el.innerHTML = `<div class="num">0${i + 1} / 04<b>${h.chip}</b></div><div class="title display">${h.title}</div><div class="sub">${h.sub}</div>`;
  $('#heads').appendChild(el);
});

const CALL = [
  { t: FS[0] + 3.6, to: FS[1] - .3, l: 860, y: 915, ic: 'copy', tx: 'Auto-copy ke clipboard' },
  { t: FS[0] + 4.05, to: FS[1] - .3, l: 1350, y: 915, ic: 'link', tx: 'https:// otomatis' },
  { t: FS[1] + 1.2, to: FS[2] - .3, l: 700, y: 770, ic: 'skip-forward', tx: 'Bisa dilewati' },
  { t: FS[1] + 1.7, to: FS[2] - .3, l: 700, y: 870, ic: 'lock', tx: 'Wajib ditonton' },
  { t: FS[1] + 2.2, to: FS[2] - .3, l: 1530, y: 330, ic: 'zap', tx: 'Auto redirect' },
  { t: FS[2] + 2.0, to: FS[3] - .3, l: 830, y: 885, ic: 'eye', tx: 'Read-only' },
  { t: FS[2] + 2.5, to: FS[3] - .3, l: 1150, y: 885, ic: 'shield-check', tx: 'Tanpa login' },
  { t: FS[3] + 2.2, to: T.cta - .3, l: 830, y: 885, ic: 'download', tx: 'SVG & PNG' },
  { t: FS[3] + 2.7, to: T.cta - .3, l: 1150, y: 885, ic: 'qr-code', tx: 'Warna kustom' },
];
CALL.forEach((c, i) => {
  const el = document.createElement('div');
  el.className = 'callout pill'; el.id = 'co' + i;
  el.style.left = c.l + 'px'; el.style.top = c.y + 'px';
  el.innerHTML = `<span class="ic">${ic(c.ic)}</span>${c.tx}`;
  $('#callouts').appendChild(el);
});

gsap.set(['#p1', '#p2', '#p3'], { autoAlpha: 0 });
gsap.set(['#brW'], { transformOrigin: '50% 50%' });
gsap.set('#br', { rotateY: -9, rotateX: 3 });
mg.qr('#p3qr', DEMO + '/Kk9xQ2');
mg.qr('#cta .qr', DEMO);

/* cursor inside the browser view; positions in view space so it follows the 3D transform */
function click(el, t, { press = null, sound = 'click', root = '#view' } = {}) {
  const p = mg.posIn(el, root);
  tl.to('#cur', { x: p.x + 10, y: p.y + 8, duration: .5, ease: 'power2.inOut' }, t - .55);
  tl.to('#cur', { scale: .82, duration: .07 }, t - .04);
  tl.to('#cur', { scale: 1, duration: .22, ease: 'back.out(3)' }, t + .04);
  tl.set('#rip', { x: p.x, y: p.y }, t);
  tl.fromTo('#rip', { scale: .4, opacity: 1 }, { scale: 2.2, opacity: 0, duration: .45, ease: 'power2.out', immediateRender: false }, t);
  if (press) {
    tl.to(press, { scale: .94, duration: .07 }, t - .04);
    tl.to(press, { scale: 1, duration: .3, ease: 'elastic.out(1,.5)' }, t + .04);
  }
  if (sound) sfx(sound, t, .5);
}
function transition(t) {
  tl.fromTo('#bolt', { scale: .4, rotate: -12, opacity: 0 }, { scale: 1.4, rotate: 6, opacity: .85, duration: .2, ease: 'power2.out' }, t);
  tl.to('#bolt', { opacity: 0, scale: 2.1, duration: .3, ease: 'power2.in' }, t + .2);
  tl.fromTo('#streak', { x: 0 }, { x: 2600, duration: .55, ease: 'power2.in' }, t);
  mg.flash(t, { peak: .3, dur: .4 });
}

mg.particles('#dust', 40, { seed: 5, speed: 16 });
gsap.set(['#hud', '#segs', '#ghost'], { autoAlpha: 0 });

/* ---------- hook ---------- */
const HS = [0, .8, 1.6, 2.55];
mg.show('#hook', 0);
[0, 1, 2].forEach(i => {
  const s = HS[i], id = '#hk' + i;
  tl.set(id, { autoAlpha: 1 }, s);
  tl.fromTo(`${id} .hkt`, { scale: 1.55, filter: 'blur(16px)', '--sp': 18 }, { scale: 1, filter: 'blur(0px)', '--sp': 0, duration: .4, ease: 'expo.out' }, s);
  tl.to(`${id} .hkt`, { scale: 1.05, duration: HS[i + 1] - s - .4, ease: 'none' }, s + .4);
  mg.shake('#hook', s + .02, { strength: i === 2 ? 22 : 14, dur: .3 });
  sfx('thud', s + .02, .8);
  tl.set(id, { autoAlpha: 0 }, HS[i + 1]);
});
tl.fromTo('#urlrun', { x: 40 }, { x: -520, duration: .8, ease: 'none' }, 0);
tl.fromTo('#hk1 .hkpill b', { opacity: 1 }, { opacity: .15, duration: .08, repeat: 5, yoyo: true, ease: 'none' }, .95);
tl.fromTo('#hk2 .hkpill b', { x: 0 }, { x: 6, duration: .05, repeat: 7, yoyo: true, ease: 'none' }, 1.85);
sfx('glitch', 2.2, .35);
sfx('riser', 1.0, .55);

/* ---------- logo ---------- */
mg.circleWipe('#bgAlt', T.logo - .05, { dur: .55, sound: null });
sfx('logo', T.logo, .9);
mg.flash(T.logo, { peak: .55 });
mg.show('#logo', T.logo);
mg.popIn('#logoTile', T.logo + .05, { dur: .7, ease: 'back.out(1.8)', sound: null });
$$('.ringFx').forEach((r, i) => tl.fromTo(r, { scale: 1, opacity: .9 }, { scale: 2.8 + i, opacity: 0, duration: 1.1, ease: 'power2.out' }, T.logo + .1 + i * .15));
mg.textIn('#wordmark', T.logo + .3, { by: 'chars', style: 'up', stagger: .04, sound: 'whoosh', gain: .35 });
mg.textIn('#tagline', T.logo + .65, { by: 'words', style: 'fade', dur: .45 });
tl.to('#logo', { autoAlpha: 0, y: -80, duration: .35, ease: 'power3.in' }, T.feat - .3);
tl.to('#bgAlt', { opacity: 0, duration: .45 }, T.feat - .25);

/* ---------- hud ---------- */
tl.fromTo('#hud', { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: .5 }, T.feat);
tl.to('#segs', { autoAlpha: 1, duration: .4 }, T.feat);
tl.to('#ghost', { autoAlpha: 1, duration: .6 }, T.feat);
tl.fromTo('#ghost', { x: 500 }, { x: -500, duration: T.cta - T.feat, ease: 'none' }, T.feat);
mg.segments('#segs', FS.map((f, i) => [f, FS[i + 1] || T.cta]));
tl.to('#brW', { rotateY: 3, rotateX: -1.5, y: -6, duration: T.cta - T.feat - 1, ease: 'sine.inOut' }, T.feat);
tl.to('#phW', { rotateY: -2.5, rotateX: 1.5, y: 6, duration: T.cta - T.feat - 1, ease: 'sine.inOut' }, T.feat);

/* ---------- heads + callouts ---------- */
FS.forEach((a, i) => {
  const aEnd = FS[i + 1] || T.cta, id = '#fh' + i;
  transition(a - .2);
  mg.show(id, a + .05);
  mg.textIn(`${id} .num`, a + .05, { by: 'words', style: 'fade', dur: .4 });
  mg.textIn(`${id} .title`, a + .12, { by: 'lines', style: 'up', sound: 'whoosh', gain: .45 });
  mg.textIn(`${id} .sub`, a + .5, { by: 'words', style: 'fade' });
  mg.textOut(`${id} .title`, aEnd - .42);
  tl.to([`${id} .sub`, `${id} .num`], { autoAlpha: 0, duration: .25 }, aEnd - .38);
  mg.hide(id, aEnd + .05);
});
CALL.forEach((c, i) => {
  const id = '#co' + i;
  mg.popIn(id, c.t, { from: .4, gain: .5 });
  mg.float(id, c.t + .6, c.to, { amp: 8, phase: i * 1.7 });
  tl.to(id, { autoAlpha: 0, duration: .25 }, c.to);
});

/* ---------- 01 desktop: tambah cepat ---------- */
{
  const a = FS[0];
  mg.show('#br', a);
  tl.fromTo('#br', { x: 760, y: 90, rotateY: -55, scale: .88 }, { x: 0, y: 0, rotateY: -9, scale: 1, duration: 1, ease: 'expo.out' }, a + .05);
  sfx('whoosh-big', a - .05, .6);
  tl.set('#w1', { autoAlpha: 1 }, a);
  tl.set('#cur', { x: 880, y: 560, autoAlpha: 1 }, a + .7);
  click('#qBox', a + 1.45);
  tl.set('#qPh', { autoAlpha: 0 }, a + 1.55);
  mg.type('#qTx', URL_LONG, a + 1.6, { per: .009, sound: 'typing', gain: .5, caret: true });
  click('#qBtn', a + 3.05, { press: '#qBtn' });
  tl.set('#qDone', { autoAlpha: 1 }, a + 3.1);
  sfx('success', a + 3.12, .55);
  mg.scramble('#qLink', 'link.solusikoding.com/Kk9xQ2', a + 3.12, { dur: .6, sound: null });
  tl.fromTo('#toast', { yPercent: -220, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .45, ease: 'back.out(1.6)' }, a + 3.15);
  sfx('notify', a + 3.2, .4);
  tl.to('#toast', { autoAlpha: 0, yPercent: -160, duration: .3 }, a + 4.4);
  tl.to('#slot', { height: 82, duration: .5, ease: 'back.out(1.4)' }, a + 3.35);
  mg.count('#stTotal', 2, 3, a + 3.4, .3, { sound: null });
  tl.to('#cur', { autoAlpha: 0, duration: .2 }, a + 3.6);
}

/* ---------- 02 mobile: interstitial sponsor ---------- */
{
  const a = FS[1];
  // measure the skip button in its final (wider) state so the tap lands where the button ends up
  const lbl = $('#skipLbl'); const lab0 = lbl.textContent;
  lbl.textContent = 'Lanjut ke tautan asli';
  mg.show('#ph', a);
  const skip = mg.posIn('#skipBtn', '#stage');
  lbl.textContent = lab0;

  tl.to('#br', { x: 430, y: 40, scale: .68, rotateY: -28, opacity: .4, duration: .7, ease: 'power3.inOut' }, a - .1);
  tl.set('#p1', { autoAlpha: 1 }, a);
  tl.fromTo('#ph', { y: 950, rotateX: 35, scale: .9 }, { y: 0, rotateX: 0, scale: 1, duration: 1, ease: 'expo.out' }, a + .05);
  sfx('whoosh', a - .05, .55);

  const c0 = a + .8;
  mg.setText('#skipLbl', 'Lewati (2s)', c0 + .6);
  mg.setText('#skipLbl', 'Lewati (1s)', c0 + 1.2);
  mg.setText('#skipLbl', 'Lanjut ke tautan asli', c0 + 1.8);
  mg.setClass('#skipBtn', 'go', c0 + 1.8);
  tl.fromTo('#pfill', { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: 'none' }, c0);
  [.6, 1.2].forEach(d => sfx('tick', c0 + d, .35, { dur: .12 }));
  sfx('beep', c0 + 1.8, .35);

  mg.fingerShow(a + 2.35, { x: skip.x + 50, y: skip.y + 80 });
  mg.tap({ x: skip.x, y: skip.y }, a + 3.15, { press: '#skipBtn', gain: .6 });
  mg.fingerHide(a + 3.6);
  tl.set('#redir', { autoAlpha: 1 }, a + 3.2);
  tl.fromTo('#redir', { clipPath: 'circle(0% at 82% 9%)' }, { clipPath: 'circle(150% at 82% 9%)', duration: .55, ease: 'power2.in' }, a + 3.2);
  sfx('success', a + 3.35, .55);
}

/* ---------- 03 laporan publik ---------- */
{
  const a = FS[2];
  tl.to('#br', { x: -150, y: -5, scale: .8, rotateY: -8, opacity: 1, duration: .8, ease: 'power3.inOut' }, a - .1);
  tl.set('#w1', { autoAlpha: 0 }, a + .1);
  tl.set('#w2', { autoAlpha: 1 }, a + .1);
  mg.setText('#urlbar', 'link.solusikoding.com/report/k8Xp2Qm', a + .1);
  sfx('whoosh', a - .05, .5);
  tl.to('#ph', { x: 450, y: 70, scale: .74, rotateY: 0, duration: .8, ease: 'power3.inOut' }, a - .1);
  tl.to('#p1', { autoAlpha: 0, duration: .2 }, a + .1);
  tl.to('#p2', { autoAlpha: 1, duration: .25 }, a + .2);

  const thou = v => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  mg.count('#rpA', 0, 2480, a + .9, 1.3, { format: thou });
  mg.count('#rpB', 0, 1916, a + .95, 1.3, { format: thou, sound: null });
  mg.count('#rpC', 0, 18.4, a + 1.0, 1.3, { format: v => v.toFixed(1).replace('.', ',') + '%', sound: null });
  mg.count('#rpD', 0, 1702, a + 1.05, 1.3, { format: thou, sound: null });
  mg.count('#rpE', 0, 18.4, a + 1.0, 1.3, { format: v => v.toFixed(1).replace('.', ',') + '%', sound: null });
  [['#chL', 0], ['#chL2', .25]].forEach(([id, d]) => {
    const p = $(id), len = Math.ceil(p.getTotalLength());
    p.style.strokeDasharray = len;
    tl.fromTo(p, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, a + .9 + d);
  });
  tl.fromTo('#chA', { opacity: 0 }, { opacity: 1, duration: .6 }, a + 1.9);
  tl.from('#w2 .bz', { scaleX: 0, duration: .6, stagger: .08, ease: 'power3.out' }, a + 1.5);
  sfx('swipe', a + 1.5, .3);

  mg.popIn('#bb1', a + 1.5, { from: .8, sound: 'notify', gain: .5 });
  mg.popIn('#bb2', a + 2.7, { from: .8, sound: 'pop', gain: .45 });
  mg.popIn('#bb3', a + 3.6, { from: .8, sound: 'pop', gain: .45 });
}

/* ---------- 04 keamanan + QR ---------- */
{
  const a = FS[3];
  tl.to('#br', { x: -150, scale: .82, duration: .6, ease: 'power3.inOut' }, a - .05);
  tl.set('#w2', { autoAlpha: 0 }, a + .1);
  tl.set('#w3', { autoAlpha: 1 }, a + .1);
  mg.setText('#urlbar', 'link.solusikoding.com', a + .1);
  sfx('whoosh', a - .05, .45);
  tl.to('#p2', { autoAlpha: 0, duration: .2 }, a + .1);
  tl.to('#p3', { autoAlpha: 1, duration: .25 }, a + .2);
  mg.popIn('#p3qr', a + .45, { from: .7, sound: 'scan', gain: .35 });

  tl.set('#cur', { x: 720, y: 520, autoAlpha: 1 }, a + .1);
  click('#inPin', a + .85);
  mg.setClass('#inPin', 'f', a + .85, a + 1.9);
  tl.set('#phPin', { autoAlpha: 0 }, a + .95);
  mg.type('#txPin', '••••', a + .95, { per: .1, sound: null, caret: false });
  [0, 1, 2, 3].forEach(k => sfx('key', a + .95 + k * .1, .35));
  tl.set('#stPin', { autoAlpha: 1 }, a + 1.5);
  sfx('pop', a + 1.5, .45);

  click('#inExp', a + 1.95);
  mg.setClass('#inExp', 'f', a + 1.95, a + 2.9);
  tl.set('#phExp', { autoAlpha: 0 }, a + 2.05);
  mg.type('#txExp', '31/12/2026 23.59', a + 2.05, { per: .04, sound: 'typing', gain: .4, caret: false });

  click('#inClk', a + 2.85);
  mg.setClass('#inClk', 'f', a + 2.85, a + 3.6);
  tl.set('#phClk', { autoAlpha: 0 }, a + 2.95);
  mg.type('#txClk', '100', a + 2.95, { per: .1, sound: null, caret: false });
  [0, 1, 2].forEach(k => sfx('key', a + 2.95 + k * .1, .35));
  tl.set('#stLim', { autoAlpha: 1 }, a + 3.3);
  sfx('success', a + 3.3, .5);

  click('#btnSave', a + 3.9, { press: '#btnSave' });
  tl.to('#cur', { autoAlpha: 0, duration: .2 }, a + 4.2);

  // QR palette cycles through the app's six colors
  const pal = ['#18181b', '#0284c7', '#059669', '#dc2626', '#7c3aed', '#ea580c'];
  const dots = $$('#pal i'), qrEl = $('#p3qr'), c0 = a + .9;
  mg.onSeek(time => {
    const k = Math.max(0, Math.min(5, Math.floor((time - c0) / .45)));
    qrEl.style.setProperty('--qrc', pal[k]);
    dots.forEach((d, j) => d.classList.toggle('on', j === k));
  });
  [1, 2, 3, 4, 5].forEach(k => sfx('click', c0 + k * .45, .25));
  mg.setText('#dlSvg', ic('check') + 'Terunduh', a + 3.75);
  tl.to('#dlSvg', { scale: .94, duration: .08 }, a + 3.7);
  tl.to('#dlSvg', { scale: 1, duration: .3, ease: 'elastic.out(1,.5)' }, a + 3.78);
}

/* ---------- cta ---------- */
{
  const t = T.cta;
  transition(t - .25);
  tl.to('#br', { x: '+=900', rotateY: -45, autoAlpha: 0, duration: .5, ease: 'power3.in' }, t - .45);
  tl.to('#ph', { y: 1200, rotateX: 28, autoAlpha: 0, duration: .5, ease: 'power3.in' }, t - .45);
  tl.to(['#hud', '#segs', '#ghost'], { autoAlpha: 0, duration: .3 }, t - .2);
  mg.circleWipe('#bgAlt', t - .05, { dur: .7, x: '75%', y: '50%', sound: 'whoosh', gain: .7 });
  tl.set('#bgAlt', { opacity: 1 }, t - .05);
  sfx('impact', t + .35, .7);
  mg.show('#cta', t);
  mg.popIn('#cta .logoS', t + .3, { sound: null });
  mg.textIn('#cta .name', t + .45, { by: 'chars', stagger: .04 });
  mg.textIn('#cta .line', t + .85, { by: 'words', style: 'fade' });
  mg.popIn('#cta .demo', t + 1.0, { from: .6, gain: .55 });
  tl.fromTo('#cta .demo .qr svg', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .7, ease: 'power2.out' }, t + 1.25);
  sfx('scan', t + 1.25, .4, { dur: .7 });
  mg.popIn('#cta .btn-cta', t + 1.6, { from: .6, gain: .6 });
  sfx('success', t + 1.75, .45);
  tl.to('#cta .btn-cta', { scale: 1.04, duration: .45, yoyo: true, repeat: 5, ease: 'sine.inOut' }, t + 2.4);
  mg.textIn('#cta .tags', t + 2.0, { by: 'words', style: 'fade' });
  tl.to('#cta .demo', { y: -8, duration: 1.4, yoyo: true, repeat: 1, ease: 'sine.inOut' }, t + 2.6);
}

mg.bgm('audio/music/1135-dare-me.mp3', { offset: 12, gain: 1, fadeOut: 1.2 });
await mg.finish();
})();
