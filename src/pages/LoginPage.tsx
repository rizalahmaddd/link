import React, { useState } from 'react';
import { Link2, CheckCircle2, Sparkles, QrCode, Mail, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.requestMagicLink(email.trim());
      if (res.success) {
        setSent(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mengirim tautan masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const highlights = [
    'Pengalihan edge instan sub-15ms didukung Cloudflare KV Cache.',
    'Monetisasi iklan eksternal (foto & YouTube) dengan 0 beban penyimpanan server.',
    'Kontrol iklan hierarkis: saklar global akun atau penyesuaian granular per tautan.',
    'Analitik lokal akurat: zona waktu WIB, ISP Indonesia, dan perlindungan privasi UU PDP.'
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr] bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800 selection:text-zinc-100">
      
      {/* Left Showcase Pane (Desk Style) */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-zinc-800 bg-[#0c0d12] p-12 text-zinc-100">
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-sm shadow-sm">
            <Link2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-zinc-100">Link</span>
        </div>

        {/* Central Studio Card & Manifesto */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto py-8">
          
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              Smart URL Shortener & Monetisasi Sponsor
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-zinc-100">
              Tautan ringkas, monetisasi sponsor, analitik nyata.
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Link menyatukan pengalihan edge kilat sub-15ms, monetisasi sponsor gambar & video YouTube tanpa beban penyimpanan server, dynamic QR code siap cetak, dan analitik pengunjung dalam satu platform terpadu.
            </p>
          </div>

          {/* Miniature Studio Card Mockup */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-semibold text-zinc-100">
                  link.solusikoding.com/promo
                </span>
              </div>
              <span className="rounded-md bg-zinc-800/80 border border-zinc-700/50 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                12ms • CGK
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 truncate max-w-[260px] font-mono text-[11px]">
                  https://solusikoding.com/event-2026
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">302 Edge</span>
              </div>
              <div className="flex items-center gap-3 pt-1 border-t border-zinc-800/60 text-xs text-zinc-300">
                <span><strong>1.420</strong> Klik</span>
                <span className="text-zinc-600">•</span>
                <span><strong>890</strong> Pengunjung Unik</span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400 font-medium">YouTube Ads (5s)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-0.5">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-zinc-400" />
                Dynamic QR PNG & SVG
              </span>
              <span className="text-zinc-500">Filter Bot Medsos Aktif</span>
            </div>
          </div>

          {/* Bullet Benefits */}
          <ul className="space-y-3 pt-1">
            {highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-zinc-400 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800/80 pt-4">
          <span>Link Open Source Edition</span>
          <span>solusikoding.com</span>
        </div>

      </div>

      {/* Right Form Pane */}
      <div className="flex min-h-screen flex-col bg-zinc-950">
        
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-6 lg:hidden border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-xs shadow-sm">
              <Link2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="font-semibold text-base tracking-tight text-zinc-100">Link</span>
          </div>
          <span className="text-xs text-zinc-500">Pemendek Tautan</span>
        </div>

        {/* Center Container */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm space-y-6">
            
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 shadow-xl">
              
              <div className="space-y-1.5 mb-6">
                <h2 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
                  Masuk ke Link
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Masukkan alamat email Anda untuk menerima tautan masuk instan tanpa kata sandi.
                </p>
              </div>

              {sent ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>Tautan masuk telah terkirim</span>
                    </div>
                    <p className="text-xs text-emerald-200/90 leading-relaxed">
                      Kami telah mengirimkan tautan masuk ke <strong className="text-white">{email}</strong>. Silakan periksa kotak masuk atau spam email Anda.
                    </p>
                  </div>

                  <p className="text-[11px] text-zinc-500 text-center">
                    Tautan masuk berlaku selama 15 menit dan hanya dapat digunakan 1 kali.
                  </p>

                  <button
                    onClick={() => {
                      setSent(false);
                      setError(null);
                    }}
                    className="w-full py-2 px-3 text-xs text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800 rounded-lg hover:bg-zinc-800/60"
                  >
                    Gunakan email lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs leading-relaxed">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-medium text-zinc-300">
                      Alamat email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@perusahaan.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs sm:text-sm shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <span>Mengirim tautan...</span>
                    ) : (
                      <>
                        <span>Kirim tautan masuk</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>

            {/* Subtle terms / privacy note */}
            <p className="text-center text-[11px] text-zinc-600">
              Dengan masuk, Anda menyetujui kebijakan penggunaan layanan Link.
            </p>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-xs text-zinc-600 border-t border-zinc-900 lg:hidden">
          &copy; {new Date().getFullYear()} Link
        </div>

      </div>

    </div>
  );
};

export default LoginPage;
