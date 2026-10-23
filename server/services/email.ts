/**
 * Resend.com Email Integration for Passwordless Magic Link Authentication
 * Clean, minimal, human-crafted design matching projectdesk standards.
 */

interface SendMagicLinkParams {
  to: string;
  magicLinkUrl: string;
  apiKey?: string;
  fromEmail?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendMagicLinkEmail({
  to,
  magicLinkUrl,
  apiKey,
  fromEmail = 'Link <link@solusikoding.com>'
}: SendMagicLinkParams): Promise<{ success: boolean; simulated?: boolean; message?: string }> {
  // If no Resend API key is provided, log to console for development testing
  if (!apiKey || apiKey === 'YOUR_RESEND_API_KEY_HERE') {
    console.info(`[email:dev] to=${to} url=${magicLinkUrl}`);
    return {
      success: true,
      simulated: true,
      message: 'Tautan masuk telah dibuat (mode pengembangan).'
    };
  }

  const htmlContent = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Masuk ke Link</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;-webkit-font-smoothing:antialiased;">
  <div style="max-width:520px;margin:0 auto;padding:48px 20px;">
    <div style="background-color:#ffffff;border:1px solid #e4e4e7;border-radius:14px;padding:36px 32px;">
      
      <p style="margin:0 0 24px;font-size:16px;font-weight:700;color:#18181b;letter-spacing:-0.02em;">Link</p>
      
      <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;line-height:1.3;color:#18181b;letter-spacing:-0.01em;">Masuk ke akun Anda</h1>
      
      <p style="margin:0 0 28px;color:#52525b;font-size:14px;line-height:1.6;">
        Klik tombol di bawah ini untuk langsung masuk ke dashboard Link Anda tanpa kata sandi.
      </p>

      <div style="margin:0 0 28px;">
        <a href="${magicLinkUrl}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:-0.01em;">
          Masuk ke Link
        </a>
      </div>

      <p style="margin:0 0 20px;color:#71717a;font-size:13px;line-height:1.5;">
        Tautan ini berlaku selama 15 menit dan hanya dapat digunakan satu kali.
      </p>

      <div style="border-top:1px solid #f4f4f5;padding-top:16px;">
        <p style="margin:0 0 6px;color:#a1a1aa;font-size:12px;">Jika tombol di atas tidak berfungsi, buka tautan berikut di browser Anda:</p>
        <p style="margin:0;color:#71717a;font-size:11px;word-break:break-all;line-height:1.4;">${escapeHtml(magicLinkUrl)}</p>
      </div>

    </div>

    <p style="text-align:center;color:#a1a1aa;font-size:12px;margin-top:24px;">
      Jika Anda tidak merasa meminta email ini, silakan abaikan.
    </p>
  </div>
</body>
</html>`;

  const textContent = `Link\n\nMasuk ke akun Anda\n\nBuka tautan berikut untuk masuk ke dashboard Link:\n${magicLinkUrl}\n\nTautan ini berlaku selama 15 menit.`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: 'Masuk ke Link',
        html: htmlContent,
        text: textContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return { success: false, message: 'Gagal mengirim email verifikasi.' };
    }

    return { success: true, message: 'Tautan masuk telah dikirim ke email Anda.' };
  } catch (err: any) {
    console.error('Error sending email:', err);
    return { success: false, message: 'Terjadi gangguan jaringan saat mengirim email.' };
  }
}
