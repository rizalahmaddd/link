/**
 * Interstitial Sponsor Page Renderer
 * Immersive full-screen media with modern sticky header overlay & action stack.
 */

interface InterstitialOptions {
  slug: string;
  linkId: string;
  targetUrl: string;
  adType: 'image' | 'youtube';
  mediaUrl: string;
  headline?: string;
  timerSeconds?: number;
  ctaText?: string;
  ctaUrl?: string;
  isIAB?: boolean;
  skippable?: boolean;
  autoRedirect?: boolean;
  hasPassword?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

export function renderInterstitialHtml(opts: InterstitialOptions): string {
  const seconds = opts.timerSeconds && opts.timerSeconds > 0 ? opts.timerSeconds : 5;
  const headline = opts.headline || 'Pesan Sponsor';
  const ctaText = opts.ctaText || 'Kunjungi Sponsor';
  const ctaUrl = opts.ctaUrl || opts.mediaUrl;
  const isSkippable = opts.skippable !== false;
  const isAutoRedirect = Boolean(opts.autoRedirect || !isSkippable);
  const hasPassword = Boolean(opts.hasPassword);
  
  // Auto-detect YouTube URL even if adType was marked as image
  const isYouTube = opts.adType === 'youtube' || (opts.mediaUrl && (opts.mediaUrl.includes('youtube.com') || opts.mediaUrl.includes('youtu.be')));
  
  let youtubeEmbedUrl = '';
  if (isYouTube) {
    const videoId = extractYouTubeId(opts.mediaUrl);
    if (videoId) {
      youtubeEmbedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`;
    }
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${escapeHtml(headline)} — Link</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #000000;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Fixed Top Overlay Header */
    .overlay-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 56px;
      z-index: 100;
      background: rgba(9, 9, 11, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(39, 39, 42, 0.85);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .header-content {
      height: 54px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      max-width: 1600px;
      margin: 0 auto;
      width: 100%;
    }

    /* Left: Branding & Sponsor Details */
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex-shrink: 0;
    }

    .brand-mark {
      display: flex;
      align-items: center;
      gap: 7px;
      text-decoration: none;
      color: #fafafa;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: -0.02em;
      flex-shrink: 0;
    }

    .brand-badge {
      width: 26px;
      height: 26px;
      border-radius: 7px;
      background: #fafafa;
      color: #09090b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
    }

    .divider {
      width: 1px;
      height: 16px;
      background: #27272a;
      flex-shrink: 0;
    }

    .sponsor-pill {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #71717a;
      background: #18181b;
      border: 1px solid #27272a;
      padding: 2px 7px;
      border-radius: 5px;
      flex-shrink: 0;
    }

    .headline-text {
      font-size: 13px;
      font-weight: 500;
      color: #e4e4e7;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 280px;
    }

    .sponsor-link-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      color: #a1a1aa;
      background: #18181b;
      border: 1px solid #27272a;
      padding: 4px 10px;
      border-radius: 6px;
      text-decoration: none;
      transition: all 0.15s ease;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .sponsor-link-btn:hover {
      background: #27272a;
      color: #ffffff;
      border-color: #3f3f46;
    }

    /* Right: Countdown & Skip Action Stack */
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .timer-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #a1a1aa;
      background: #18181b;
      border: 1px solid #27272a;
      padding: 5px 10px;
      border-radius: 7px;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    .timer-pill.done {
      color: #10b981;
      border-color: rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.08);
    }

    .timer-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #f59e0b;
      animation: pulse 1.5s infinite;
    }

    .timer-pill.done .timer-dot {
      background: #10b981;
      animation: none;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .btn-skip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 14px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      white-space: nowrap;
      outline: none;
      flex-shrink: 0;
    }

    .btn-skip:disabled {
      background: #18181b;
      color: #71717a;
      border-color: #27272a;
      cursor: not-allowed;
    }

    .btn-skip:not(:disabled) {
      background: #ffffff;
      color: #09090b;
      border-color: #ffffff;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
    }

    .btn-skip:not(:disabled):hover {
      background: #f4f4f5;
    }

    /* Progress bar at the bottom edge of header */
    .progress-bar {
      width: 100%;
      height: 2px;
      background: rgba(255, 255, 255, 0.06);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      width: 0%;
      background: #ffffff;
      transition: width 0.3s ease;
    }

    /* Fullscreen Media Container */
    .media-viewport {
      position: fixed;
      top: 56px;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .fullscreen-iframe {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
    }

    .fullscreen-image-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: 16px;
      text-decoration: none;
      cursor: pointer;
    }

    .fullscreen-image {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
    }

    /* Floating Sponsor CTA Button for Mobile */
    .mobile-sponsor-fab {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 101;
      background: rgba(24, 24, 27, 0.92);
      border: 1px solid rgba(63, 63, 70, 0.8);
      border-radius: 9999px;
      padding: 9px 18px;
      color: #fafafa;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .mobile-sponsor-fab:hover {
      background: #27272a;
      border-color: #71717a;
    }

    /* In-App Browser Warning Banner */
    .iab-alert {
      position: fixed;
      top: 66px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 101;
      background: rgba(24, 24, 27, 0.95);
      border: 1px solid #3f3f46;
      border-radius: 10px;
      padding: 8px 14px;
      font-size: 11px;
      color: #e4e4e7;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      max-width: 90%;
      white-space: nowrap;
    }

    /* Password PIN Challenge Overlay */
    .pwd-overlay {
      position: fixed;
      inset: 0;
      z-index: 200;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .pwd-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 24px;
      max-width: 360px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes popIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .pwd-icon {
      width: 42px;
      height: 42px;
      background: #27272a;
      color: #fafafa;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .pwd-card h3 {
      font-size: 15px;
      font-weight: 600;
      color: #fafafa;
      margin-bottom: 6px;
    }
    .pwd-card p {
      font-size: 12px;
      color: #a1a1aa;
      margin-bottom: 16px;
      line-height: 1.5;
    }
    .pwd-error {
      font-size: 11px;
      color: #f87171;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      padding: 8px 10px;
      margin-bottom: 12px;
    }
    .pwd-card input {
      width: 100%;
      background: #09090b;
      border: 1px solid #27272a;
      color: #fafafa;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      box-sizing: border-box;
      margin-bottom: 12px;
      outline: none;
      text-align: center;
      letter-spacing: 0.1em;
    }
    .pwd-card input:focus {
      border-color: #71717a;
    }
    .pwd-card button {
      width: 100%;
      background: #ffffff;
      color: #09090b;
      font-weight: 600;
      font-size: 13px;
      border: 0;
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .pwd-card button:hover {
      background: #e4e4e7;
    }

    /* Anti-Adblock Notice Toast */
    .adblock-toast {
      position: fixed;
      bottom: 72px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 102;
      background: rgba(24, 24, 27, 0.95);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 12px;
      padding: 8px 14px;
      color: #f59e0b;
      font-size: 11px;
      display: none;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.7);
      max-width: 90%;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    .adblock-close {
      background: transparent;
      border: 0;
      color: #a1a1aa;
      cursor: pointer;
      font-size: 14px;
      padding: 0 4px;
    }

    /* RESPONSIVE SPECIFICATION FOR MOBILE (STRICT ANTI-COLLISION) */
    @media (max-width: 640px) {
      .header-content {
        padding: 0 12px;
        gap: 8px;
      }
      .brand-mark span:last-child {
        display: none !important; /* Hide text 'Link', keep 'L' icon badge */
      }
      .divider {
        display: none !important;
      }
      .headline-text {
        display: none !important;
      }
      .sponsor-link-btn {
        display: none !important; /* Move to mobile-sponsor-fab at bottom */
      }
      .timer-pill {
        display: none !important; /* Skip button already contains countdown (e.g. 'Lewati (5s)') */
      }
      .btn-skip {
        height: 32px;
        padding: 0 12px;
        font-size: 12px;
      }
    }

    @media (min-width: 641px) {
      .mobile-sponsor-fab {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Overlay Header with Action Stack & Countdown -->
  <header class="overlay-header">
    <div class="header-content">
      
      <!-- Left: Logo & Sponsor Tag -->
      <div class="header-left">
        <a href="/" class="brand-mark" title="Link">
          <span class="brand-badge">L</span>
          <span>Link</span>
        </a>
        
        <span class="divider"></span>
        <span class="sponsor-pill">Sponsor</span>
        <span class="headline-text" title="${escapeHtml(headline)}">${escapeHtml(headline)}</span>
        
        <a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener noreferrer" class="sponsor-link-btn" onclick="onCtaClick()">
          <span>${escapeHtml(ctaText)}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
        </a>
      </div>

      <!-- Right: Countdown & Skip Action Stack -->
      <div class="header-right">
        <div id="timer-box" class="timer-pill">
          <span class="timer-dot"></span>
          <span id="countdown-label">${isSkippable ? 'Tunggu' : 'Sponsor'} <strong id="countdown">${seconds}</strong>s</span>
        </div>

        <button id="btn-proceed" class="btn-skip ${!isSkippable ? 'unskippable' : ''}" disabled onclick="proceedToTarget()">
          <span id="btn-label">${isSkippable ? `Lewati (${seconds}s)` : `Wajib ditonton (${seconds}s)`}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

    </div>

    <!-- Countdown Progress Bar -->
    <div class="progress-bar">
      <div id="progress-fill" class="progress-fill"></div>
    </div>
  </header>

  <!-- Fullscreen Media Viewport -->
  <main class="media-viewport">
    ${
      isYouTube && youtubeEmbedUrl
        ? `<iframe 
             src="${youtubeEmbedUrl}" 
             title="YouTube Video Sponsor" 
             class="fullscreen-iframe" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
             allowfullscreen>
           </iframe>`
        : `<a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener noreferrer" class="fullscreen-image-link" onclick="onCtaClick()">
             <img src="${escapeHtml(opts.mediaUrl)}" alt="Sponsor" class="fullscreen-image" loading="lazy" />
           </a>`
    }
  </main>

  <!-- Floating Sponsor Button on Mobile (Placed near thumbs) -->
  <a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener noreferrer" class="mobile-sponsor-fab" onclick="onCtaClick()">
    <span>${escapeHtml(ctaText)}</span>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
  </a>

  <!-- Anti-Adblock Detector Beacon -->
  <div id="ad-sponsor-detector" class="ad-banner adsbox pub_300x250 pub_728x90" style="position:absolute;width:1px;height:1px;left:-9999px;top:-9999px;"></div>
  
  <div id="adblock-notice" class="adblock-toast">
    <span>💡 Ekstensi Adblock terdeteksi. Dukung pembuat tautan dengan menonaktifkan Adblock jika sponsor tidak tampil.</span>
    <button onclick="this.parentElement.style.display='none'" class="adblock-close" aria-label="Tutup">×</button>
  </div>

  ${
    opts.isIAB
      ? `<div class="iab-alert">
           <span>Buka di Chrome atau Safari untuk kenyamanan maksimal.</span>
         </div>`
      : ''
  }

  ${
    hasPassword
      ? `<div id="password-modal" class="pwd-overlay" style="display:none;">
           <div class="pwd-card">
             <div class="pwd-icon">
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             </div>
             <h3>Tautan Dilindungi Sandi</h3>
             <p>Masukkan kata sandi atau PIN untuk melanjutkan ke tautan tujuan.</p>
             <div id="pwd-error" class="pwd-error" style="display:none;"></div>
             <form onsubmit="verifyPassword(event)">
               <input type="password" id="input-password" placeholder="Masukkan PIN / Sandi" required autofocus />
               <button type="submit" id="btn-submit-pwd">Buka Tautan</button>
             </form>
           </div>
         </div>`
      : ''
  }

  <script>
    var totalSeconds = ${seconds};
    var remaining = totalSeconds;
    var targetUrl = "${escapeHtml(opts.targetUrl)}";
    var linkId = "${escapeHtml(opts.linkId || '')}";
    var slug = "${escapeHtml(opts.slug)}";
    var isSkippable = ${isSkippable};
    var autoRedirect = ${isAutoRedirect};
    var hasPassword = ${hasPassword};
    var navigated = false;
    
    var countdownEl = document.getElementById('countdown');
    var countdownLabel = document.getElementById('countdown-label');
    var timerBox = document.getElementById('timer-box');
    var proceedBtn = document.getElementById('btn-proceed');
    var btnLabel = document.getElementById('btn-label');
    var progressFill = document.getElementById('progress-fill');

    function trackEvent(evt) {
      if (!linkId) return;
      try {
        var payload = JSON.stringify({ linkId: linkId, event: evt });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/v1/track/event', payload);
        } else {
          fetch('/api/v1/track/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          }).catch(function(){});
        }
      } catch(e){}
    }

    // Record Impression on Load
    trackEvent('impression');

    function onCtaClick() {
      trackEvent('cta_click');
    }

    var timer = setInterval(function() {
      remaining--;
      var progress = ((totalSeconds - remaining) / totalSeconds) * 100;
      if (progressFill) {
        progressFill.style.width = Math.min(progress, 100) + "%";
      }

      if (remaining > 0) {
        if (countdownEl) countdownEl.innerText = remaining;
        if (btnLabel) {
          btnLabel.innerText = isSkippable ? "Lewati (" + remaining + "s)" : "Wajib tonton (" + remaining + "s)";
        }
      } else {
        clearInterval(timer);
        if (progressFill) progressFill.style.width = "100%";
        if (timerBox) timerBox.className = "timer-pill done";

        if (isSkippable) {
          if (countdownLabel) countdownLabel.innerText = "Selesai";
          if (proceedBtn) {
            proceedBtn.disabled = false;
            proceedBtn.classList.remove('unskippable');
          }
          if (btnLabel) btnLabel.innerText = "Lanjut ke tautan asli";
          if (autoRedirect) {
            setTimeout(proceedToTarget, 500);
          }
        } else {
          // Unskippable auto-redirect
          if (countdownLabel) countdownLabel.innerText = "Mengalihkan...";
          if (btnLabel) btnLabel.innerText = "Mengalihkan...";
          setTimeout(proceedToTarget, 500);
        }
      }
    }, 1000);

    function proceedToTarget() {
      if (navigated) return;
      if (remaining > 0 && isSkippable) return;

      if (hasPassword) {
        showPasswordModal();
        return;
      }

      navigated = true;
      trackEvent('skip');
      window.location.href = targetUrl;
    }

    function showPasswordModal() {
      var modal = document.getElementById('password-modal');
      if (modal) {
        modal.style.display = 'flex';
        var inp = document.getElementById('input-password');
        if (inp) inp.focus();
      }
    }

    function verifyPassword(e) {
      e.preventDefault();
      var pwdInput = document.getElementById('input-password');
      var errEl = document.getElementById('pwd-error');
      var submitBtn = document.getElementById('btn-submit-pwd');
      if (!pwdInput) return;
      var pwd = pwdInput.value;
      if (errEl) errEl.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Memverifikasi...';
      }

      fetch('/api/v1/links/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug, password: pwd })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success && data.target_url) {
          navigated = true;
          trackEvent('skip');
          window.location.href = data.target_url;
        } else {
          if (errEl) {
            errEl.innerText = data.error || 'Kata sandi salah. Coba lagi.';
            errEl.style.display = 'block';
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Buka Tautan';
          }
        }
      })
      .catch(function() {
        if (errEl) {
          errEl.innerText = 'Gagal memverifikasi sandi. Silakan coba lagi.';
          errEl.style.display = 'block';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Buka Tautan';
        }
      });
    }

    // Anti-adblock detection
    setTimeout(function() {
      var detector = document.getElementById('ad-sponsor-detector');
      if (detector && (detector.offsetHeight === 0 || detector.style.display === 'none')) {
        var notice = document.getElementById('adblock-notice');
        if (notice) notice.style.display = 'flex';
      }
    }, 1200);
  </script>
</body>
</html>`;
}
