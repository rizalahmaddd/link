import React, { useState, useEffect } from 'react';
import { X, Lock, Clock, Share2, ChevronDown, Sparkles, ExternalLink, ShieldCheck, Eye } from 'lucide-react';
import { ShortLink } from '../types';
import { api } from '../services/api';

interface CreateEditLinkModalProps {
  isOpen: boolean;
  linkToEdit?: ShortLink | null;
  onClose: () => void;
  onSaved: () => void;
}

export const CreateEditLinkModal: React.FC<CreateEditLinkModalProps> = ({
  isOpen,
  linkToEdit,
  onClose,
  onSaved
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [targetUrl, setTargetUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [adMode, setAdMode] = useState<'inherit' | 'custom' | 'disabled'>('inherit');
  
  // Custom Ad fields
  const [adType, setAdType] = useState<'image' | 'youtube'>('image');
  const [adMediaUrl, setAdMediaUrl] = useState('');
  const [adHeadline, setAdHeadline] = useState('');
  const [adTimerSeconds, setAdTimerSeconds] = useState(5);
  const [adCtaText, setAdCtaText] = useState('Kunjungi Sponsor');
  const [adCtaUrl, setAdCtaUrl] = useState('');
  const [adSkippable, setAdSkippable] = useState(true);
  const [adAutoRedirect, setAdAutoRedirect] = useState(false);

  // Advanced link options
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxClicks, setMaxClicks] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (linkToEdit) {
        setTargetUrl(linkToEdit.target_url);
        setSlug(linkToEdit.slug);
        setTitle(linkToEdit.title || '');
        setAdMode(linkToEdit.ad_mode);
        setAdType(linkToEdit.ad_type === 'youtube' ? 'youtube' : 'image');
        setAdMediaUrl(linkToEdit.ad_media_url || '');
        setAdHeadline(linkToEdit.ad_headline || '');
        setAdTimerSeconds(linkToEdit.ad_timer_seconds || 5);
        setAdCtaText(linkToEdit.ad_cta_text || 'Kunjungi Sponsor');
        setAdCtaUrl(linkToEdit.ad_cta_url || '');
        setAdSkippable(linkToEdit.ad_skippable !== 0 && linkToEdit.ad_skippable !== false);
        setAdAutoRedirect(Boolean(linkToEdit.ad_auto_redirect));
        setPassword('');
        setExpiresAt(linkToEdit.expires_at ? linkToEdit.expires_at.slice(0, 16) : '');
        setMaxClicks(linkToEdit.max_clicks ? String(linkToEdit.max_clicks) : '');
        setOgTitle(linkToEdit.og_title || '');
        setOgDescription(linkToEdit.og_description || '');
        setOgImageUrl(linkToEdit.og_image_url || '');
        setShowAdvancedMobile(Boolean(linkToEdit.has_password || linkToEdit.expires_at || linkToEdit.max_clicks || linkToEdit.og_title));
      } else {
        setTargetUrl('');
        setSlug('');
        setTitle('');
        setAdMode('inherit');
        setAdType('image');
        setAdMediaUrl('');
        setAdHeadline('');
        setAdTimerSeconds(5);
        setAdCtaText('Kunjungi Sponsor');
        setAdCtaUrl('');
        setAdSkippable(true);
        setAdAutoRedirect(false);
        setPassword('');
        setExpiresAt('');
        setMaxClicks('');
        setOgTitle('');
        setOgDescription('');
        setOgImageUrl('');
        setShowAdvancedMobile(false);
      }
    }
  }, [isOpen, linkToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetUrl.trim()) {
      setError('URL tujuan wajib diisi.');
      return;
    }

    if (adMode === 'custom' && !adMediaUrl.trim()) {
      setError('URL link foto atau video wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        target_url: targetUrl.trim(),
        slug: slug.trim().toLowerCase() || undefined,
        title: title.trim() || undefined,
        ad_mode: adMode,
        ad_type: adMode === 'custom' ? adType : 'none',
        ad_media_url: adMode === 'custom' ? adMediaUrl.trim() : null,
        ad_headline: adMode === 'custom' ? adHeadline.trim() : null,
        ad_timer_seconds: adMode === 'custom' ? adTimerSeconds : 5,
        ad_cta_text: adMode === 'custom' ? adCtaText.trim() : null,
        ad_cta_url: adMode === 'custom' ? adCtaUrl.trim() : null,
        ad_skippable: adMode === 'custom' ? (adSkippable ? 1 : 0) : undefined,
        ad_auto_redirect: adMode === 'custom' ? (adAutoRedirect ? 1 : 0) : undefined,
        password: password ? password.trim() : (password === '' && linkToEdit?.has_password ? '' : undefined),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        max_clicks: maxClicks ? Number(maxClicks) : null,
        og_title: ogTitle.trim() || null,
        og_description: ogDescription.trim() || null,
        og_image_url: ogImageUrl.trim() || null
      };

      if (linkToEdit) {
        await api.updateLink(linkToEdit.id, payload);
      } else {
        await api.createLink(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg lg:max-w-5xl xl:max-w-6xl shadow-2xl my-auto max-h-[96dvh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800 flex-shrink-0 bg-zinc-900">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-zinc-100">
              {linkToEdit ? 'Edit Tautan' : 'Buat Tautan'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Atur URL tujuan, sponsor interstitial, keamanan sandi, dan pratinjau media sosial.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          {error && (
            <div className="mx-4 sm:mx-6 mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Section Grid: 1 column on mobile, 2 balanced columns on desktop */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
              
              {/* LEFT SECTION: Pengaturan Utama & Sponsor */}
              <div className="space-y-4">
                
                {/* Section Header */}
                <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                    Pengaturan Utama Tautan
                  </span>
                </div>

                {/* Destination URL */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    URL Tujuan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://contoh.com/artikel-panjang-atau-produk"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>

                {/* Slug & Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Slug Kustom (opsional)
                    </label>
                    <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-xs focus-within:border-zinc-600">
                      <span className="text-zinc-500 mr-1 select-none">/</span>
                      <input
                        type="text"
                        value={slug}
                        disabled={Boolean(linkToEdit)}
                        onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                        placeholder="promo2026"
                        className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-xs disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Catatan Internal (opsional)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Label internal kampanye"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                  </div>
                </div>

                {/* Section Header: Mode Iklan */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-800 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                      Mode Iklan Sponsor
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs text-center">
                    <button
                      type="button"
                      onClick={() => setAdMode('inherit')}
                      className={`py-1.5 rounded-md font-medium transition-colors ${
                        adMode === 'inherit' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Ikuti global
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdMode('custom')}
                      className={`py-1.5 rounded-md font-medium transition-colors ${
                        adMode === 'custom' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Iklan khusus
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdMode('disabled')}
                      className={`py-1.5 rounded-md font-medium transition-colors ${
                        adMode === 'disabled' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Tanpa iklan
                    </button>
                  </div>
                </div>

                {/* Mode info box for inherit / disabled */}
                {adMode === 'inherit' && (
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs space-y-1">
                    <span className="font-medium text-zinc-200 block">Mengikuti Iklan Global Akun</span>
                    <p className="text-[11px] text-zinc-400">
                      Tautan ini otomatis menampilkan konfigurasi iklan akun yang diatur di menu Iklan Global.
                    </p>
                  </div>
                )}

                {adMode === 'disabled' && (
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs space-y-1">
                    <span className="font-medium text-zinc-200 block">Direct Redirection (HTTP 302)</span>
                    <p className="text-[11px] text-zinc-400">
                      Pengunjung langsung dialihkan ke URL tujuan secara instan tanpa jeda halaman sponsor.
                    </p>
                  </div>
                )}

                {/* Custom Ad Settings */}
                {adMode === 'custom' && (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    
                    {/* Media Type Toggle */}
                    <div className="flex rounded-lg bg-zinc-900 p-0.5 border border-zinc-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setAdType('image')}
                        className={`flex-1 py-1 rounded-md font-medium transition-colors ${
                          adType === 'image' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Foto (URL)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdType('youtube')}
                        className={`flex-1 py-1 rounded-md font-medium transition-colors ${
                          adType === 'youtube' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Video YouTube (URL)
                      </button>
                    </div>

                    {/* Media URL */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        {adType === 'image' ? 'URL Foto' : 'Link Video YouTube'} <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="url"
                        value={adMediaUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAdMediaUrl(val);
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
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Judul Iklan</label>
                        <input
                          type="text"
                          value={adHeadline}
                          onChange={(e) => setAdHeadline(e.target.value)}
                          placeholder="Penawaran Spesial"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Detik</label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={adTimerSeconds}
                          onChange={(e) => setAdTimerSeconds(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                    </div>

                    {/* CTA Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Teks Tombol</label>
                        <input
                          type="text"
                          value={adCtaText}
                          onChange={(e) => setAdCtaText(e.target.value)}
                          placeholder="Kunjungi Sponsor"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Link Tombol</label>
                        <input
                          type="url"
                          value={adCtaUrl}
                          onChange={(e) => setAdCtaUrl(e.target.value)}
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
                          onClick={() => setAdSkippable(true)}
                          className={`py-1.5 rounded-md font-medium transition-colors ${
                            adSkippable ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          Bisa Dilewati (Timer)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdSkippable(false)}
                          className={`py-1.5 rounded-md font-medium transition-colors ${
                            !adSkippable ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          Wajib Selesai (Forced)
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {adSkippable
                          ? 'Pengunjung dapat menekan tombol lewati setelah timer selesai.'
                          : 'Tombol lewati ditiadakan. Pengunjung otomatis dialihkan setelah timer selesai.'}
                      </p>

                      {adSkippable && (
                        <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                          <input
                            type="checkbox"
                            checked={adAutoRedirect}
                            onChange={(e) => setAdAutoRedirect(e.target.checked)}
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

              </div>

              {/* RIGHT SECTION: Opsi Tingkat Lanjut & Live Preview */}
              <div className="space-y-4">
                
                {/* Section Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                      Opsi Tingkat Lanjut & Keamanan
                    </span>
                  </div>

                  {/* Toggle button on mobile */}
                  <button
                    type="button"
                    onClick={() => setShowAdvancedMobile(!showAdvancedMobile)}
                    className="lg:hidden text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                  >
                    <span>{showAdvancedMobile ? 'Sembunyikan' : 'Buka Opsi'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedMobile ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Container: Always visible on desktop (lg:), toggled on mobile */}
                <div className={`space-y-4 ${showAdvancedMobile ? 'block' : 'hidden lg:block'}`}>
                  
                  {/* Password Protection */}
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <label className="flex items-center gap-1.5 font-medium text-xs text-zinc-200">
                      <Lock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Proteksi Sandi / PIN (Opsional)</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={linkToEdit?.has_password ? 'Sandi aktif (ketik baru untuk ganti)' : 'Ketik PIN atau sandi rahasia'}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Pengunjung wajib memasukkan sandi sebelum dapat melihat sponsor atau membuka tautan.
                    </p>
                  </div>

                  {/* Expiration & Click Limits */}
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Batas Akses Tautan</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-zinc-400 mb-1 text-[11px]">
                          Kedaluwarsa (WIB)
                        </label>
                        <input
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1 text-[11px]">
                          Batas Maksimal Klik
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={maxClicks}
                          onChange={(e) => setMaxClicks(e.target.value)}
                          placeholder="Contoh: 100"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Open Graph Social Preview */}
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                    <label className="flex items-center gap-1.5 font-medium text-xs text-zinc-200">
                      <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Kustomisasi Tampilan WhatsApp & Medsos</span>
                    </label>
                    <div className="space-y-2 text-xs">
                      <input
                        type="text"
                        value={ogTitle}
                        onChange={(e) => setOgTitle(e.target.value)}
                        placeholder="Judul pratinjau medsos (OG Title)..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                      />
                      <input
                        type="text"
                        value={ogDescription}
                        onChange={(e) => setOgDescription(e.target.value)}
                        placeholder="Deskripsi singkat saat tautan dibagikan..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                      />
                      <input
                        type="url"
                        value={ogImageUrl}
                        onChange={(e) => setOgImageUrl(e.target.value)}
                        placeholder="https://... URL gambar cover thumbnail (OG Image)"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                  </div>

                </div>

                {/* Live Real-time Card Preview */}
                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      <Eye className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Live Pratinjau Tautan</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">Real-time</span>
                  </div>

                  {/* Preview Card */}
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium text-zinc-100">
                        /{slug || (linkToEdit?.slug ?? 'slug-kustom')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                        {adMode === 'inherit' ? 'Ikuti Global' : adMode === 'custom' ? 'Iklan Khusus' : 'Direct 302'}
                      </span>
                    </div>

                    {/* Social Snippet Card */}
                    {(ogTitle || ogDescription || ogImageUrl || title) ? (
                      <div className="border border-zinc-800/90 rounded-lg p-2.5 bg-zinc-950/60 flex items-start gap-2.5">
                        {ogImageUrl ? (
                          <img
                            src={ogImageUrl}
                            alt="Cover"
                            className="w-12 h-12 object-cover rounded bg-zinc-800 shrink-0"
                            onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-500 text-[10px] font-mono">
                            OG
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="font-medium text-zinc-200 truncate text-[11px]">
                            {ogTitle || title || slug || 'Judul Tautan'}
                          </div>
                          <div className="text-[10px] text-zinc-400 line-clamp-2">
                            {ogDescription || targetUrl || 'Deskripsi singkat pratinjau media sosial.'}
                          </div>
                          <div className="text-[9px] text-zinc-500 truncate">
                            link.solusikoding.com
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-500 truncate flex items-center gap-1">
                        <span>Target:</span>
                        <span className="text-zinc-400 truncate">{targetUrl || 'Belum ada URL tujuan'}</span>
                      </div>
                    )}

                    {/* Badges footer */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                      {password && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Sandi PIN Aktif
                        </span>
                      )}
                      {expiresAt && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          Ada batas waktu
                        </span>
                      )}
                      {maxClicks && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          Maks {maxClicks} klik
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-zinc-800 flex-shrink-0 bg-zinc-900">
            <div className="text-[11px] text-zinc-500 hidden sm:block truncate max-w-xs">
              {slug ? `link.solusikoding.com/${slug}` : 'Slug akan di-generate otomatis jika kosong'}
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
                disabled={loading}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {loading && <span className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />}
                <span>{loading ? 'Menyimpan...' : linkToEdit ? 'Simpan Perubahan' : 'Buat Tautan'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
