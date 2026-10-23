import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  BarChart2,
  QrCode,
  Edit2,
  Trash2,
  Radio,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  Lock,
  Clock,
  Target,
  Share2,
  Sparkles,
  Link2,
  Zap,
  ArrowRight,
  CheckCircle2,
  X
} from 'lucide-react';
import { ShortLink, User } from '../types';
import { api } from '../services/api';
import { CreateEditLinkModal } from '../components/CreateEditLinkModal';
import { QRCodeModal } from '../components/QRCodeModal';
import { AnalyticsModal } from '../components/AnalyticsModal';
import { GlobalAdModal } from '../components/GlobalAdModal';

interface DashboardPageProps {
  user: User;
  onRefreshUser: () => void;
}

interface OverviewData {
  total_links: number;
  total_clicks: number;
  total_uniques: number;
  sponsor_impressions: number;
  sponsor_cta_clicks: number;
  sponsor_skips: number;
  sponsor_ctr: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onRefreshUser }) => {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'inherit' | 'custom' | 'disabled'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'clicks' | 'alphabetical'>('newest');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Quick Shorten state
  const [quickUrl, setQuickUrl] = useState('');
  const [quickCustomSlug, setQuickCustomSlug] = useState('');
  const [quickAdMode, setQuickAdMode] = useState<'inherit' | 'disabled'>('inherit');
  const [showQuickOptions, setShowQuickOptions] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [lastCreatedLink, setLastCreatedLink] = useState<ShortLink | null>(null);
  const [copiedLastLink, setCopiedLastLink] = useState(false);
  const quickInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [linkToEdit, setLinkToEdit] = useState<ShortLink | null>(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedLinkForQR, setSelectedLinkForQR] = useState<ShortLink | null>(null);

  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedLinkForAnalytics, setSelectedLinkForAnalytics] = useState<ShortLink | null>(null);

  const [globalAdModalOpen, setGlobalAdModalOpen] = useState(false);

  // Copied states
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copiedReportSlug, setCopiedReportSlug] = useState<string | null>(null);

  // Menus state & outside click
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLinks();
    fetchOverview();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterMenuRef.current && !filterMenuRef.current.contains(target)) {
        setFilterMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(target)) {
        setSortMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFilterMenuOpen(false);
        setSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await api.getLinks();
      if (res.success) {
        setLinks(res.data);
      }
    } catch (err) {
      console.error('Error fetching links:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await api.getOverviewSummary();
      if (res.success && res.data) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error('Error fetching overview summary:', err);
    }
  };

  const handleCopy = (slug: string) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1500);
  };

  const handleCopyReport = (link: ShortLink) => {
    if (!link.report_token) {
      alert('Token laporan belum tersedia untuk tautan ini.');
      return;
    }
    const reportUrl = `${window.location.origin}/report/${link.report_token}`;
    navigator.clipboard.writeText(reportUrl);
    setCopiedReportSlug(link.slug);
    setTimeout(() => setCopiedReportSlug(null), 2000);
  };

  const handleToggleActive = async (link: ShortLink) => {
    const isCurrentlyActive = link.is_active !== 0 && link.is_active !== false;
    const nextActive = !isCurrentlyActive;

    // Optimistic UI update
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, is_active: nextActive ? 1 : 0 } : l))
    );
    setTogglingId(link.id);

    try {
      await api.toggleLinkActive(link.id);
      fetchOverview();
    } catch (err: any) {
      // Revert on error
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, is_active: isCurrentlyActive ? 1 : 0 } : l))
      );
      alert(err?.message || 'Gagal mengubah status tautan.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, slug: string) => {
    if (!window.confirm(`Hapus tautan "/${slug}"? Analitik dan metrik sponsor terkait akan ikut dihapus.`)) {
      return;
    }
    try {
      await api.deleteLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      if (lastCreatedLink && lastCreatedLink.id === id) {
        setLastCreatedLink(null);
      }
      fetchOverview();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus tautan.');
    }
  };

  const handleQuickShorten = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let url = quickUrl.trim();
    if (!url) return;

    // Auto prepend https:// if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    setQuickLoading(true);
    setQuickError(null);

    try {
      const res = await api.createLink({
        target_url: url,
        slug: quickCustomSlug.trim() ? quickCustomSlug.trim().toLowerCase() : undefined,
        ad_mode: quickAdMode
      });

      if (res.success && res.data) {
        const newLink = res.data;
        // Prepend to links list
        setLinks((prev) => [newLink, ...prev.filter((l) => l.id !== newLink.id)]);
        setLastCreatedLink(newLink);

        // Auto copy to clipboard
        const fullUrl = `${window.location.origin}/${newLink.slug}`;
        try {
          await navigator.clipboard.writeText(fullUrl);
          setCopiedLastLink(true);
          setTimeout(() => setCopiedLastLink(false), 2500);
        } catch {
          // Ignore clipboard permission issues
        }

        // Reset inputs
        setQuickUrl('');
        setQuickCustomSlug('');
        setShowQuickOptions(false);
        fetchOverview();
      }
    } catch (err: any) {
      setQuickError(err?.message || 'Gagal memperpendek tautan.');
    } finally {
      setQuickLoading(false);
    }
  };

  const filterOptions = [
    { value: 'all', label: 'Semua mode' },
    { value: 'inherit', label: 'Ikuti global' },
    { value: 'custom', label: 'Iklan khusus' },
    { value: 'disabled', label: 'Tanpa iklan (Direct)' },
  ] as const;

  const sortOptions = [
    { value: 'newest', label: 'Terbaru dibuat' },
    { value: 'clicks', label: 'Klik terbanyak' },
    { value: 'alphabetical', label: 'Nama A-Z' },
  ] as const;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: links.length, inherit: 0, custom: 0, disabled: 0 };
    links.forEach((l) => {
      if (l.ad_mode && l.ad_mode in c) {
        c[l.ad_mode]++;
      }
    });
    return c;
  }, [links]);

  const activeFilterOption = filterOptions.find((opt) => opt.value === filterMode) || filterOptions[0];
  const activeSortOption = sortOptions.find((opt) => opt.value === sortBy) || sortOptions[0];

  const filteredLinks = useMemo(() => {
    const list = links.filter((item) => {
      const matchesSearch =
        item.slug.toLowerCase().includes(search.toLowerCase()) ||
        item.target_url.toLowerCase().includes(search.toLowerCase()) ||
        (item.title && item.title.toLowerCase().includes(search.toLowerCase()));

      if (filterMode === 'all') return matchesSearch;
      return matchesSearch && item.ad_mode === filterMode;
    });

    return list.sort((a, b) => {
      if (sortBy === 'clicks') {
        return (b.clicks_count || 0) - (a.clicks_count || 0);
      }
      if (sortBy === 'alphabetical') {
        return a.slug.localeCompare(b.slug);
      }
      // 'newest'
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [links, search, filterMode, sortBy]);

  const totalClicks = overview?.total_clicks ?? links.reduce((acc, curr) => acc + (curr.clicks_count || 0), 0);
  const activeLinksCount = links.filter((l) => l.is_active !== 0 && l.is_active !== false).length;
  const pausedLinksCount = links.length - activeLinksCount;

  return (
    <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Tautan</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Kelola tautan singkat, konfigurasi sponsor lewati/wajib, dan pantau performa.</p>
        </div>

        <button
          onClick={() => {
            setLinkToEdit(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat tautan</span>
        </button>
      </div>

      {/* Top Metric Strip (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Total Links */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Total Tautan
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
            {overview?.total_links ?? links.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5 truncate">
            <span className="text-emerald-400 font-medium">{activeLinksCount} aktif</span>
            {pausedLinksCount > 0 && (
              <>
                <span>&bull;</span>
                <span className="text-zinc-400">{pausedLinksCount} jeda</span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Total Clicks */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Total Kunjungan
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
            {totalClicks.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 truncate">
            {overview?.total_uniques !== undefined ? (
              <span><strong className="text-zinc-300 font-medium">{overview.total_uniques.toLocaleString('id-ID')}</strong> unik (30h)</span>
            ) : (
              'Akumulasi seluruh tautan'
            )}
          </div>
        </div>

        {/* Card 3: Sponsor CTR & Clicks */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Sponsor CTR
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
              {overview?.sponsor_ctr ?? 0}%
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">
              ({overview?.sponsor_cta_clicks ?? 0} klik)
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 truncate">
            Dari {overview?.sponsor_impressions ?? 0} tayangan iklan
          </div>
        </div>

        {/* Card 4: Global Sponsor Status */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
              Iklan Global
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${user.global_ad_enabled ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              <span className="text-xs sm:text-sm font-medium text-zinc-200">
                {user.global_ad_enabled ? 'Aktif' : 'Non-aktif'}
              </span>
              {user.global_ad_enabled && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                  {user.global_ad_skippable === false ? 'Wajib' : 'Bisa lewati'}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 text-right">
            <button
              onClick={() => setGlobalAdModalOpen(true)}
              className="text-[11px] text-zinc-400 hover:text-zinc-100 font-medium underline inline-flex items-center gap-1 transition-colors"
            >
              <span>Pengaturan sponsor</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK SHORTEN BAR (Tambah Cepat Instant) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-xs">
              <Zap className="w-3 h-3 fill-current" />
            </div>
            <span className="text-xs font-semibold text-zinc-100">Tambah Cepat</span>
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              &bull; Tempel URL panjang dan tekan Enter untuk membuat tautan instan
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowQuickOptions(!showQuickOptions)}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 font-medium flex items-center gap-1 transition-colors"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{showQuickOptions ? 'Tutup opsi' : 'Opsi slug & iklan'}</span>
          </button>
        </div>

        <form onSubmit={handleQuickShorten} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={quickInputRef}
                type="text"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="Tempel URL panjang di sini (misal: https://youtube.com/watch?v=... atau website.com) lalu tekan Enter"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                disabled={quickLoading}
              />
            </div>

            <button
              type="submit"
              disabled={quickLoading || !quickUrl.trim()}
              className="h-11 px-5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
            >
              {quickLoading ? (
                <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Perpendek</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Quick Options Drawer (Custom Slug & Mode) */}
          {showQuickOptions && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-zinc-800/80 animate-in fade-in-50 duration-150">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Kustom Slug (opsional)
                </label>
                <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs focus-within:border-zinc-600">
                  <span className="text-zinc-500 mr-1 select-none font-mono">/</span>
                  <input
                    type="text"
                    value={quickCustomSlug}
                    onChange={(e) => setQuickCustomSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                    placeholder="slug-pilihanmu"
                    className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Mode Iklan Tautan
                </label>
                <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setQuickAdMode('inherit')}
                    className={`py-1.5 rounded-md font-medium transition-colors ${
                      quickAdMode === 'inherit' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Ikuti Global
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickAdMode('disabled')}
                    className={`py-1.5 rounded-md font-medium transition-colors ${
                      quickAdMode === 'disabled' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Direct 302
                  </button>
                </div>
              </div>
            </div>
          )}

          {quickError && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              {quickError}
            </div>
          )}
        </form>

        {/* Instant Success Banner */}
        {lastCreatedLink && (
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-emerald-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-medium text-zinc-100">
                  <span className="font-mono text-emerald-400 font-semibold">/{lastCreatedLink.slug}</span>
                  <span className="text-zinc-500">&rarr;</span>
                  <span className="text-zinc-300 truncate max-w-[200px] sm:max-w-md">{lastCreatedLink.target_url}</span>
                </div>
                <div className="text-[11px] text-emerald-400/90 flex items-center gap-1 mt-0.5">
                  <span>{copiedLastLink ? 'Tersalin otomatis ke clipboard!' : 'Tautan berhasil diperpendek dan siap dibagikan'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button
                onClick={() => {
                  const fullUrl = `${window.location.origin}/${lastCreatedLink.slug}`;
                  navigator.clipboard.writeText(fullUrl);
                  setCopiedLastLink(true);
                  setTimeout(() => setCopiedLastLink(false), 2000);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                title="Salin tautan"
              >
                {copiedLastLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLastLink ? 'Tersalin' : 'Salin'}</span>
              </button>

              <button
                onClick={() => {
                  setSelectedLinkForQR(lastCreatedLink);
                  setQrModalOpen(true);
                }}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Lihat QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setLinkToEdit(lastCreatedLink);
                  setCreateModalOpen(true);
                }}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Kustomisasi Detail (PIN, Iklan Khusus, Medsos)"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setLastCreatedLink(null)}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors ml-1"
                title="Tutup notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter, Sort and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari slug, tujuan, atau judul..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Custom Filter Popover Dropdown */}
          <div className="relative flex-1 sm:flex-initial" ref={filterMenuRef}>
            <button
              type="button"
              onClick={() => {
                setFilterMenuOpen((prev) => !prev);
                setSortMenuOpen(false);
              }}
              className={`w-full sm:w-48 h-9 px-3 rounded-lg border text-xs font-medium transition-all select-none flex items-center justify-between gap-2 ${
                filterMenuOpen 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-xs' 
                  : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100'
              }`}
              aria-haspopup="listbox"
              aria-expanded={filterMenuOpen}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-zinc-200 font-medium truncate">{activeFilterOption.label}</span>
                {filterMode !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 ml-auto transition-transform duration-200 ${filterMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {filterMenuOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-full sm:w-56 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shadow-2xl shadow-black/80 z-30 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/80 mb-1">
                  Filter Mode Iklan
                </div>
                <div className="space-y-0.5">
                  {filterOptions.map((opt) => {
                    const isSelected = filterMode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFilterMode(opt.value as any);
                          setFilterMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 sm:py-1.5 rounded-lg text-xs text-left transition-colors ${
                          isSelected 
                            ? 'bg-zinc-800 text-zinc-100 font-medium' 
                            : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-500 tabular-nums">
                            {counts[opt.value] ?? 0}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-zinc-200 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sort Popover Dropdown */}
          <div className="relative flex-1 sm:flex-initial" ref={sortMenuRef}>
            <button
              type="button"
              onClick={() => {
                setSortMenuOpen((prev) => !prev);
                setFilterMenuOpen(false);
              }}
              className={`w-full sm:w-44 h-9 px-3 rounded-lg border text-xs font-medium transition-all select-none flex items-center justify-between gap-2 ${
                sortMenuOpen 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-xs' 
                  : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100'
              }`}
              aria-haspopup="listbox"
              aria-expanded={sortMenuOpen}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-zinc-200 font-medium truncate">{activeSortOption.label}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 ml-auto transition-transform duration-200 ${sortMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {sortMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-full sm:w-48 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shadow-2xl shadow-black/80 z-30 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/80 mb-1">
                  Urutkan Berdasarkan
                </div>
                <div className="space-y-0.5">
                  {sortOptions.map((opt) => {
                    const isSelected = sortBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.value as any);
                          setSortMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 sm:py-1.5 rounded-lg text-xs text-left transition-colors ${
                          isSelected 
                            ? 'bg-zinc-800 text-zinc-100 font-medium' 
                            : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-zinc-200 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Link Items */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-xs">
            Memuat tautan...
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="py-16 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-8 space-y-3">
            <p className="text-xs text-zinc-400">
              {search || filterMode !== 'all' ? 'Tidak ada tautan yang cocok dengan pencarian atau filter.' : 'Belum ada tautan dibuat.'}
            </p>
            {filterMode !== 'all' && (
              <button
                onClick={() => setFilterMode('all')}
                className="text-xs text-zinc-300 hover:text-white underline font-medium"
              >
                Reset filter
              </button>
            )}
            {!search && filterMode === 'all' && (
              <button
                onClick={() => quickInputRef.current?.focus()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Buat tautan pertama di atas</span>
              </button>
            )}
          </div>
        ) : (
          filteredLinks.map((item) => {
            const isActive = item.is_active !== 0 && item.is_active !== false;
            const isCustomAd = item.ad_mode === 'custom';
            const isInheritAd = item.ad_mode === 'inherit';
            
            // Determine skip rule
            const isSkippable = isCustomAd
              ? (item.ad_skippable !== 0 && item.ad_skippable !== false)
              : (user.global_ad_skippable !== false);

            const isExpired = item.expires_at ? new Date(item.expires_at).getTime() < Date.now() : false;
            const isClickLimitReached = item.max_clicks ? (item.clicks_count || 0) >= item.max_clicks : false;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl bg-zinc-900 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  !isActive 
                    ? 'border-zinc-800/40 opacity-70 bg-zinc-900/50' 
                    : 'border-zinc-800/80 hover:border-zinc-700/80'
                }`}
              >
                
                {/* Details */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Active Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      disabled={togglingId === item.id}
                      title={isActive ? 'Klik untuk jeda tautan' : 'Klik untuk mengaktifkan tautan'}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors select-none ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                      <span>{isActive ? 'Aktif' : 'Dijeda'}</span>
                    </button>

                    <span className="font-semibold text-sm text-zinc-100 tracking-tight">
                      /{item.slug}
                    </span>

                    {/* Mode Tag */}
                    {isInheritAd && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300">
                        <Radio className="w-2.5 h-2.5 text-zinc-400" />
                        <span>Ikuti global</span>
                      </span>
                    )}
                    {isCustomAd && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        <span>Iklan khusus ({item.ad_type === 'youtube' ? 'YouTube' : 'Foto'})</span>
                      </span>
                    )}
                    {item.ad_mode === 'disabled' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400">
                        <span>Direct 302</span>
                      </span>
                    )}

                    {/* Skip or Forced Ad Badge (if sponsor active) */}
                    {(isInheritAd && user.global_ad_enabled) || isCustomAd ? (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                        isSkippable 
                          ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {isSkippable ? 'Bisa lewati' : 'Wajib tonton'}
                      </span>
                    ) : null}

                    {/* Password Protection Badge */}
                    {item.has_password && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Lock className="w-2.5 h-2.5" />
                        <span>PIN</span>
                      </span>
                    )}

                    {/* Expiration Badge */}
                    {item.expires_at && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                        isExpired 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                          : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40'
                      }`}>
                        <Clock className="w-2.5 h-2.5" />
                        <span>{isExpired ? 'Kadaluarsa' : 'Ada limit waktu'}</span>
                      </span>
                    )}

                    {/* Max Clicks Badge */}
                    {item.max_clicks && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                        isClickLimitReached
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40'
                      }`}>
                        <Target className="w-2.5 h-2.5" />
                        <span>{item.clicks_count}/{item.max_clicks} klik</span>
                      </span>
                    )}

                    {item.title && (
                      <span className="text-xs text-zinc-400 truncate max-w-[140px] sm:max-w-xs">&bull; {item.title}</span>
                    )}
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate max-w-full">
                    <a
                      href={item.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-zinc-200 truncate flex items-center gap-1 transition-colors max-w-full"
                      title={item.target_url}
                    >
                      <span className="truncate max-w-[200px] sm:max-w-md">{item.target_url}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0 text-zinc-500" />
                    </a>
                  </div>
                </div>

                {/* Metrics & Actions */}
                <div className="flex items-center gap-3 justify-between md:justify-end border-t md:border-t-0 pt-2.5 md:pt-0 border-zinc-800/80">
                  <div className="text-xs text-zinc-400 font-medium">
                    {(item.clicks_count || 0).toLocaleString('id-ID')} klik
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {/* Copy Shortlink */}
                    <button
                      onClick={() => handleCopy(item.slug)}
                      className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                      title="Salin tautan singkat"
                      aria-label="Salin tautan singkat"
                    >
                      {copiedSlug === item.slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* QR Code */}
                    <button
                      onClick={() => {
                        setSelectedLinkForQR(item);
                        setQrModalOpen(true);
                      }}
                      className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                      title="QR Code"
                      aria-label="QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>

                    {/* Analytics Modal */}
                    <button
                      onClick={() => {
                        setSelectedLinkForAnalytics(item);
                        setAnalyticsModalOpen(true);
                      }}
                      className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                      title="Statistik & Analitik"
                      aria-label="Statistik & Analitik"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Share Public Report */}
                    {item.report_token && (
                      <button
                        onClick={() => handleCopyReport(item)}
                        className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                        title={copiedReportSlug === item.slug ? "Tautan laporan tersalin!" : "Salin tautan laporan publik untuk klien/sponsor"}
                        aria-label="Salin tautan laporan sponsor"
                      >
                        {copiedReportSlug === item.slug ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => {
                        setLinkToEdit(item);
                        setCreateModalOpen(true);
                      }}
                      className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                      title="Edit"
                      aria-label="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id, item.slug)}
                      className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 transition-colors"
                      title="Hapus"
                      aria-label="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <CreateEditLinkModal
        isOpen={createModalOpen}
        linkToEdit={linkToEdit}
        onClose={() => {
          setCreateModalOpen(false);
          setLinkToEdit(null);
        }}
        onSaved={() => {
          fetchLinks();
          fetchOverview();
        }}
      />

      <QRCodeModal
        isOpen={qrModalOpen}
        link={selectedLinkForQR}
        onClose={() => {
          setQrModalOpen(false);
          setSelectedLinkForQR(null);
        }}
      />

      <AnalyticsModal
        isOpen={analyticsModalOpen}
        link={selectedLinkForAnalytics}
        onClose={() => {
          setAnalyticsModalOpen(false);
          setSelectedLinkForAnalytics(null);
        }}
      />

      <GlobalAdModal
        isOpen={globalAdModalOpen}
        onClose={() => setGlobalAdModalOpen(false)}
        onUpdated={() => {
          onRefreshUser();
          fetchOverview();
        }}
      />

    </div>
  );
};
