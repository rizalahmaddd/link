import React, { useState, useEffect } from 'react';
import { X, Sparkles, Eye, ShieldCheck, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

interface GlobalAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const GlobalAdModal: React.FC<GlobalAdModalProps> = ({ isOpen, onClose, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [adType, setAdType] = useState<'image' | 'youtube'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [headline, setHeadline] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(5);
  const [ctaText, setCtaText] = useState('Kunjungi Sponsor');
  const [ctaUrl, setCtaUrl] = useState('');
  const [skippable, setSkippable] = useState(true);
  const [autoRedirect, setAutoRedirect] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getGlobalAdSettings();
      if (res.success && res.data) {
        setEnabled(res.data.global_ad_enabled);
        setAdType(res.data.global_ad_type === 'youtube' ? 'youtube' : 'image');
        setMediaUrl(res.data.global_ad_media_url || '');
        setHeadline(res.data.global_ad_headline || '');
        setTimerSeconds(res.data.global_ad_timer_seconds || 5);
        setCtaText(res.data.global_ad_cta_text || 'Kunjungi Sponsor');
        setCtaUrl(res.data.global_ad_cta_url || '');
        setSkippable(res.data.global_ad_skippable !== false);
        setAutoRedirect(Boolean(res.data.global_ad_auto_redirect));
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat pengaturan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (enabled && !mediaUrl.trim()) {
      setError('URL link foto atau link video YouTube wajib diisi saat iklan aktif.');
      return;
    }

    setSaving(true);
    try {
      await api.updateGlobalAdSettings({
        global_ad_enabled: enabled,
        global_ad_type: adType,
        global_ad_media_url: mediaUrl.trim(),
        global_ad_headline: headline.trim(),
        global_ad_timer_seconds: timerSeconds,
        global_ad_cta_text: ctaText.trim(),
        global_ad_cta_url: ctaUrl.trim(),
        global_ad_skippable: skippable,
        global_ad_auto_redirect: autoRedirect
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg lg:max-w-5xl xl:max-w-6xl shadow-2xl my-auto max-h-[96dvh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800 flex-shrink-0 bg-zinc-900">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-zinc-100">Iklan Global Akun</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Berlaku secara default untuk semua tautan pendek yang diatur &quot;Ikuti Global&quot;.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-zinc-500">Memuat konfigurasi iklan...</div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
            
            {error && (
              <div className="mx-4 sm:mx-6 mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Section Grid: 1 col on mobile, 2 cols on desktop */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
                
                {/* LEFT SECTION: Pengaturan Iklan Global */}
                <div className="space-y-4">
                  
                  {/* Status Toggle Box */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div>
                      <span className="text-xs font-semibold text-zinc-100 block">Status Iklan Global</span>
                      <span className="text-[11px] text-zinc-400 mt-0.5 block">
                        {enabled ? 'Iklan aktif pada seluruh tautan default' : 'Iklan non-aktif (pengunjung langsung direct)'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                    </label>
                  </div>

                  {enabled && (
                    <div className="space-y-3.5 p-4 rounded-xl bg-zinc-950 border border-zinc-800 animate-in fade-in-50 duration-150">
                      
                      {/* Ad Media Type */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Tipe Media Iklan</label>
                        <div className="flex rounded-lg bg-zinc-900 p-0.5 border border-zinc-800 text-xs">
                          <button
                            type="button"
                            onClick={() => setAdType('image')}
                            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                              adType === 'image' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Foto (URL)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdType('youtube')}
                            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                              adType === 'youtube' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Video YouTube (URL)
                          </button>
                        </div>
                      </div>

                      {/* Media URL */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          {adType === 'image' ? 'URL Foto' : 'Link Video YouTube'} <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="url"
                          value={mediaUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMediaUrl(val);
                            if (val.includes('youtube.com') || val.includes('youtu.be')) {
                              setAdType('youtube');
                            } else if (val.match(/\.(jpeg|jpg|gif|png|webp|svg)/i)) {
                              setAdType('image');
                            }
                          }}
                          placeholder={
                            adType === 'image'
                              ? 'https://example.com/banner.jpg'
                              : 'https://youtube.com/watch?v=...'
                          }
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                        />
                      </div>

                      {/* Headline & Timer */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-zinc-300 mb-1">Judul Sponsor</label>
                          <input
                            type="text"
                            value={headline}
                            onChange={(e) => setHeadline(e.target.value)}
                            placeholder="Penawaran Spesial Kilat"
                            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">Detik Timer</label>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={timerSeconds}
                            onChange={(e) => setTimerSeconds(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                          />
                        </div>
                      </div>

                      {/* CTA Button Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">Teks Tombol CTA</label>
                          <input
                            type="text"
                            value={ctaText}
                            onChange={(e) => setCtaText(e.target.value)}
                            placeholder="Kunjungi Sponsor"
                            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1">Link Tombol CTA</label>
                          <input
                            type="url"
                            value={ctaUrl}
                            onChange={(e) => setCtaUrl(e.target.value)}
                            placeholder="https://sponsor.com"
                            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                          />
                        </div>
                      </div>

                      {/* Perilaku Skip & Auto Redirect */}
                      <div className="pt-2 border-t border-zinc-900 space-y-2">
                        <label className="block text-xs font-medium text-zinc-300">
                          Perilaku Tombol Lewati
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
                          <button
                            type="button"
                            onClick={() => setSkippable(true)}
                            className={`py-1.5 rounded-md font-medium transition-colors ${
                              skippable ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Bisa Dilewati (Timer)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSkippable(false)}
                            className={`py-1.5 rounded-md font-medium transition-colors ${
                              !skippable ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Wajib Selesai (Forced)
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          {skippable
                            ? 'Pengunjung dapat menekan tombol lewati setelah timer selesai.'
                            : 'Tombol lewati ditiadakan. Pengunjung otomatis dialihkan setelah timer selesai.'}
                        </p>

                        {skippable && (
                          <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                            <input
                              type="checkbox"
                              checked={autoRedirect}
                              onChange={(e) => setAutoRedirect(e.target.checked)}
                              className="rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-0"
                            />
                            <span className="text-xs text-zinc-300">
                              Otomatis alihkan ke target saat countdown 0s (tanpa tunggu klik)
                            </span>
                          </label>
                        )}
                      </div>

                    </div>
                  )}

                  {!enabled && (
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 space-y-2">
                      <p>
                        Saat iklan global dinonaktifkan, tautan dengan mode <strong>Ikuti Global</strong> akan langsung mengarahkan pengunjung ke URL tujuan secara instan (Direct Redirection HTTP 302).
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Anda tetap dapat menyetel iklan khusus untuk tautan tertentu kapan saja melalui menu edit tautan.
                      </p>
                    </div>
                  )}

                </div>

                {/* RIGHT SECTION: Live Interstitial Preview & Insights */}
                <div className="space-y-4">
                  
                  {/* Preview Container */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                          Pratinjau Layar Penuh Sponsor
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Live Mockup</span>
                    </div>

                    {/* Simulated Screen */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-lg">
                      
                      {/* Mock Header */}
                      <div className="px-3 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded bg-zinc-100 text-zinc-950 text-[10px] font-bold flex items-center justify-center">
                            L
                          </div>
                          <span className="text-[10px] font-medium text-zinc-300">link.solusikoding.com</span>
                        </div>
                        <div className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                          {skippable ? `Lewati dalam ${timerSeconds}s` : `Wajib ditonton: ${timerSeconds}s`}
                        </div>
                      </div>

                      {/* Mock Media Body */}
                      <div className="p-4 space-y-3 bg-zinc-900/60 min-h-[160px] flex flex-col items-center justify-center text-center">
                        {enabled && mediaUrl ? (
                          adType === 'image' ? (
                            <img
                              src={mediaUrl}
                              alt="Sponsor Preview"
                              className="max-h-40 max-w-full rounded-lg object-contain shadow-sm bg-zinc-950"
                              onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                            />
                          ) : (
                            <div className="w-full max-w-xs h-32 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center text-zinc-400 text-xs">
                              <span className="text-rose-500 font-semibold mb-1">&#9658; Video YouTube</span>
                              <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">{mediaUrl}</span>
                            </div>
                          )
                        ) : (
                          <div className="py-6 text-zinc-600 text-xs flex flex-col items-center gap-1">
                            <Sparkles className="w-5 h-5 text-zinc-700" />
                            <span>{enabled ? 'Masukkan URL media untuk melihat pratinjau' : 'Iklan global sedang non-aktif'}</span>
                          </div>
                        )}

                        {enabled && headline && (
                          <div className="font-semibold text-xs text-zinc-100">
                            {headline}
                          </div>
                        )}

                        {/* CTA Button Mock */}
                        {enabled && (
                          <div className="pt-1 flex items-center gap-2 w-full max-w-xs justify-center">
                            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 font-medium text-[11px] shadow-sm flex items-center gap-1">
                              <span>{ctaText || 'Kunjungi Sponsor'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </div>
                            {skippable && (
                              <div className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-[11px]">
                                Lewati iklan
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>

                  {/* Best Practice Card */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs text-zinc-400 space-y-1.5">
                    <div className="font-medium text-zinc-300 text-[11px] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tips Mengoptimalkan Pendapatan Sponsor</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-zinc-500 space-y-1">
                      <li>Durasi 5-7 detik merupakan waktu terbaik agar pengunjung tidak langsung menutup tab (*bounce*).</li>
                      <li>Sertakan CTA yang kuat seperti &quot;Dapatkan Diskon&quot; atau &quot;Klaim Promo&quot; untuk meningkatkan CTR hingga 40%.</li>
                      <li>Analitik per tayangan dan per klik tersimpan otomatis di dashboard.</li>
                    </ul>
                  </div>

                </div>

              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-zinc-800 flex-shrink-0 bg-zinc-900">
              <div className="text-[11px] text-zinc-500 hidden sm:block">
                Perubahan langsung berlaku ke seluruh tautan aktif tanpa downtime.
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {saving && <span className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />}
                  <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
