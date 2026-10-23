/**
 * Indonesian Edge Case: WhatsApp, Telegram, FB, and Twitter link preview scraper detection.
 * When a user shares a link in WA or social media, the app sends a bot crawler
 * to fetch OpenGraph metadata (og:title, og:image, og:description).
 *
 * If we treat this as a human click, the analytics will be fake and inflated!
 * We return an OG HTML preview with HTTP 200 and DO NOT record click analytics.
 */

const BOT_USER_AGENTS = [
  'whatsapp',
  'facebookexternalhit',
  'facebot',
  'telegrambot',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'skypeuripreview',
  'applebot',
  'googlebot',
  'bingbot',
  'crawler',
  'spider'
];

export function isCrawlerBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}

export function renderOpenGraphPreviewHtml(params: {
  title: string;
  description: string;
  imageUrl?: string;
  targetUrl: string;
  slug: string;
  appUrl: string;
}): string {
  const displayTitle = params.title || 'Link - Tautan Singkat';
  const displayDesc = params.description || 'Klik untuk membuka tautan aman.';
  const displayImg = params.imageUrl || `${params.appUrl}/og-image.png`;
  const canonicalUrl = `${params.appUrl}/${params.slug}`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(displayTitle)}</title>
  <meta name="description" content="${escapeHtml(displayDesc)}">
  
  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${escapeHtml(displayTitle)}">
  <meta property="og:description" content="${escapeHtml(displayDesc)}">
  <meta property="og:image" content="${escapeHtml(displayImg)}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${escapeHtml(displayTitle)}">
  <meta name="twitter:description" content="${escapeHtml(displayDesc)}">
  <meta name="twitter:image" content="${escapeHtml(displayImg)}">
  
  <meta http-equiv="refresh" content="0;url=${escapeHtml(params.targetUrl)}">
</head>
<body style="font-family:sans-serif;text-align:center;padding:40px;color:#333;">
  <p>Mengarahkan ke tautan... <a href="${escapeHtml(params.targetUrl)}">Klik di sini jika tidak otomatis beralih</a></p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
