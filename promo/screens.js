const ic = (n, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24"><use href="/mg/visual/icons/lucide-sprite.svg#${n}"/></svg>`;
const SB = '<div class="ui-status"><span>09.41</span><span class="sys"><i class="sig"></i><i class="wifi"></i><i class="bat"></i></span></div>';

const row = (slug, url, tag, clicks, extra = '') => `<div class="w-row ${extra}"><div><div class="l1"><span class="ok">● Aktif</span><span class="sl">/${slug}</span><span class="tg">${tag}</span></div><div class="u">${url}</div></div>
  <div class="r"><span>${clicks}</span>${ic('copy')}${ic('qr-code')}${ic('chart-column')}${ic('share-2')}${ic('pencil')}${ic('trash')}</div></div>`;

document.getElementById('w1').innerHTML = `
  <div class="w-nav"><div class="w-brand"><i>L</i><b>Link</b></div>
    <div class="w-navr"><span class="w-pill">Iklan global: <u></u> Off</span><span>kamu@email.com</span>${ic('log-out')}</div></div>
  <div class="w-pad">
    <div class="w-head"><div><h2>Tautan</h2><p>Kelola tautan singkat, konfigurasi sponsor lewati/wajib, dan pantau performa.</p></div><span class="w-btn">${ic('plus')}Buat tautan</span></div>
    <div class="w-stats">
      <div class="w-card"><small>Total tautan</small><b id="stTotal">2</b><em class="g">2 aktif</em></div>
      <div class="w-card"><small>Total kunjungan</small><b>31</b><em>6 unik (30h)</em></div>
      <div class="w-card"><small>Sponsor CTR</small><b>0%</b><em>Dari 0 tayangan iklan</em></div>
      <div class="w-card"><small>Iklan global</small><b style="font-size:26px;margin-top:10px">Non-aktif</b></div>
    </div>
    <div class="w-quick" id="qPanel">
      <div class="w-qh"><i>${ic('zap')}</i>Tambah Cepat<span>· Tempel URL panjang dan tekan Enter untuk membuat tautan instan</span></div>
      <div class="w-qrow">
        <div class="w-in" id="qBox">${ic('link')}<span id="qPh">Tempel URL panjang di sini (misal: https://youtube.com/watch?v=… atau website.com)</span><span class="tx" id="qTx"></span></div>
        <div class="w-go" id="qBtn">Perpendek ${ic('arrow-right')}</div>
      </div>
      <div class="w-done" id="qDone">${ic('circle-check')}<span>Tersalin otomatis ke clipboard!</span><div class="lk"><span id="qLink">link.solusikoding.com/Kk9xQ2</span><i>Salin</i><i>QR</i></div></div>
    </div>
    <div class="w-list">
      <div class="w-slot" id="slot">${row('Kk9xQ2', 'https://tokoku.id/produk/kategori/baju-koko-pria-lengan-panjang-putih-ukuran-xl?utm_source=instagram', 'Ikuti global', '0 klik', 'hot')}</div>
      ${row('o2YNkc', 'https://www.youtube.com/watch?v=T5Nk6-Y8fa4', 'Ikuti global', '1 klik')}
      ${row('7WOGjG', 'https://www.youtube.com/watch?v=hGuzp5xeQQw', 'Iklan khusus (YouTube)', '30 klik')}
    </div>
  </div>
  <div class="w-toast" id="toast">${ic('circle-check')}Tersalin otomatis ke clipboard!</div>`;

/* report page values are demo data; labels follow PublicReportPage.tsx */
const chartPts = [20, 26, 22, 34, 40, 38, 52, 48, 60, 66, 58, 74, 82, 90];
const chartPts2 = chartPts.map(v => v * .42);
const smooth = (arr, w, h) => {
  const p = arr.map((v, i) => [i * w / (arr.length - 1), h - v * h / 100]);
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 1; i < p.length; i++) { const cx = (p[i - 1][0] + p[i][0]) / 2; d += ` C${cx},${p[i - 1][1]} ${cx},${p[i][1]} ${p[i][0]},${p[i][1]}`; }
  return d;
};
const CW = 560, CH = 190;
document.getElementById('w2').classList.add('w2');
document.getElementById('w2').innerHTML = `
  <div class="w-nav"><div class="w-brand"><i>L</i><b>Link</b></div><div class="w-navr"><span class="w-pill">Laporan publik · read-only</span></div></div>
  <div class="w-pad">
    <div class="rp-top"><div><div class="rp-tag">Laporan Kinerja Sponsor <span>Terverifikasi</span></div><h1>Promo Kopi Senja</h1><p>Tujuan: <u>https://tokoku.id/produk/baju-koko-putih-xl</u></p></div>
      <div class="rp-seg"><span>7 hari</span><span class="on">14 hari</span><span>30 hari</span></div></div>
    <div class="rp-grid">
      <div class="w-card"><small>Total Kunjungan</small><b id="rpA">0</b><em>Dalam rentang 14 hari terakhir</em></div>
      <div class="w-card"><small>Pengunjung Unik</small><b id="rpB">0</b><em>IP &amp; user-agent terdeduplikasi</em></div>
      <div class="w-card"><small>Sponsor CTR</small><b id="rpC" style="color:#38bdf8">0%</b><em>Klik CTA dari tayangan</em></div>
      <div class="w-card"><small>Lanjut ke Tujuan</small><b id="rpD">0</b><em>Pengunjung yang lanjut ke tujuan</em></div>
    </div>
    <div class="rp-main">
      <div class="rp-chart"><h3>Metrik Interaksi Sponsor</h3><p>Data tayangan iklan dan respon nyata dari pengunjung.</p>
        <div class="rp-ctr"><small>Rasio CTR</small><b id="rpE">0%</b></div>
        <svg viewBox="0 0 ${CW} ${CH}" preserveAspectRatio="none">
          <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0ea5e9" stop-opacity=".45"/><stop offset="1" stop-color="#0ea5e9" stop-opacity="0"/></linearGradient></defs>
          <path id="chA" d="${smooth(chartPts, CW, CH)} L${CW},${CH} L0,${CH} Z" fill="url(#ag)" opacity="0"/>
          <path id="chL" d="${smooth(chartPts, CW, CH)}" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
          <path id="chL2" d="${smooth(chartPts2, CW, CH)}" fill="none" stroke="#34d399" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="1 0"/>
        </svg>
        <div class="rp-leg"><span><i style="background:#38bdf8"></i>Tayangan</span><span><i style="background:#34d399"></i>Klik CTA</span></div></div>
      <div class="rp-side">
        <div class="rp-box"><h3>Lokasi Pengunjung (Provinsi)</h3>
          <div class="bar-row"><span>Jawa Barat</span><i style="width:150px" class="bz"></i><em>31%</em></div>
          <div class="bar-row"><span>DKI Jakarta</span><i style="width:118px" class="bz"></i><em>24%</em></div>
          <div class="bar-row"><span>Jawa Timur</span><i style="width:82px" class="bz"></i><em>17%</em></div></div>
        <div class="rp-box"><h3>Operator Provider</h3>
          <div class="bar-row"><span>Telkomsel</span><i style="width:148px;background:#34d399" class="bz"></i><em>38%</em></div>
          <div class="bar-row"><span>Indosat</span><i style="width:92px;background:#34d399" class="bz"></i><em>21%</em></div>
          <div class="bar-row"><span>XL</span><i style="width:64px;background:#34d399" class="bz"></i><em>14%</em></div></div>
      </div>
    </div>
  </div>`;

document.getElementById('w3').classList.add('w3');
document.getElementById('w3').innerHTML = `
  <div class="md">
    <div class="md-h">Edit Tautan <span>/Kk9xQ2</span></div>
    <div class="md-b">
      <div class="md-box" id="bxPin"><label>${ic('lock')}Proteksi Sandi / PIN (Opsional)</label><span class="st" id="stPin">PIN aktif</span>
        <div class="md-in" id="inPin"><span id="phPin">Ketik PIN atau sandi rahasia</span><span class="tx" id="txPin"></span></div>
        <p>Pengunjung wajib memasukkan sandi sebelum dapat melihat sponsor atau membuka tautan.</p></div>
      <div class="md-box" id="bxLim"><label>${ic('clock')}Batas Akses Tautan</label><span class="st" id="stLim">Terbatas</span>
        <div class="md-2"><div><small>Kedaluwarsa (WIB)</small><div class="md-in" id="inExp"><span id="phExp">dd/mm/yyyy --.--</span><span class="tx" id="txExp"></span></div></div>
        <div><small>Batas Maksimal Klik</small><div class="md-in" id="inClk"><span id="phClk">Contoh: 100</span><span class="tx" id="txClk"></span></div></div></div></div>
      <div class="md-f"><span class="w-btn gh">Batal</span><span class="w-btn" id="btnSave">${ic('check')}Simpan</span></div>
    </div>
  </div>`;

const scr = document.querySelector('#ph .screen');
scr.innerHTML = `
<div class="ui dark p1" id="p1">${SB}
  <div class="p1-hd"><span class="b">L</span><b>Link</b><span class="sp">Sponsor</span><span class="skip" id="skipBtn"><span id="skipLbl">Lewati (3s)</span>${ic('arrow-right')}</span></div>
  <div class="p1-bar"><i id="pfill"></i></div>
  <div class="p1-media"><img src="/mg/visual/emoji3d/hot_beverage.png" alt=""><h4>Promo Kopi Senja</h4><p>Beli 1 gratis 1, khusus hari ini</p></div>
  <div class="p1-fab">Kunjungi Sponsor ${ic('arrow-up-right')}</div>
  <div class="redir" id="redir"><div class="ck">${ic('check')}</div><b>Lanjut ke tujuan</b><span>tokoku.id/produk/baju-koko-putih-xl</span></div>
  <div class="ui-home" style="background:#fff"></div>
</div>
<div class="ui p2" id="p2">${SB}
  <div class="p2-hd"><div class="av">S</div><div><b>Bu Sinta (Sponsor)</b><small>Kampanye Kopi Senja</small></div></div>
  <div class="ui-chat" style="top:120px;padding-top:4px;background:#efeae2"><div class="p2-chat">
    <div class="bub me" id="bb1"><div class="lcard"><div class="lt"><img src="assets/logo.svg" alt="">Laporan Sponsor</div><div class="lb"><b>Laporan Kinerja Sponsor</b><span>link.solusikoding.com</span></div></div>
      <span class="lnk">link.solusikoding.com/report/k8Xp2Qm</span><small>09.42 ✓✓</small></div>
    <div class="bub" id="bb2">Mantap, angkanya jelas. Bisa langsung dibuka tanpa login?<small>09.43</small></div>
    <div class="bub me" id="bb3">Bisa. Cukup klik tautannya.<small>09.43 ✓✓</small></div>
  </div></div>
  <div class="ui-home"></div>
</div>
<div class="ui dark p3" id="p3">${SB}
  <div class="p3-hd">Kode QR Tautan ${ic('x')}</div>
  <div class="p3-card"><div class="qrc" id="p3qr"></div><small>Resolusi tinggi (vektor SVG &amp; PNG)</small></div>
  <div class="p3-t"><small>Tujuan:</small><b>link.solusikoding.com/Kk9xQ2</b></div>
  <div class="p3-t" style="margin-top:14px"><small>Warna</small></div>
  <div class="pal" id="pal"><i style="background:#18181b;box-shadow:0 0 0 2px #3f3f46"></i><i style="background:#0284c7"></i><i style="background:#059669"></i><i style="background:#dc2626"></i><i style="background:#7c3aed"></i><i style="background:#ea580c"></i></div>
  <div class="p3-b"><span class="gh">${ic('download')}Unduh PNG</span><span id="dlSvg">${ic('download')}Unduh SVG</span></div>
  <div class="ui-home"></div>
</div>`;
