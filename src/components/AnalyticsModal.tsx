import React, { useState, useEffect } from 'react';
import { X, Share2, Check, BarChart3, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AnalyticsData, ShortLink } from '../types';
import { api } from '../services/api';

interface AnalyticsModalProps {
  isOpen: boolean;
  link: ShortLink | null;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, link, onClose }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(14);
  const [error, setError] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  useEffect(() => {
    if (isOpen && link) {
      fetchAnalytics();
    }
  }, [isOpen, link, days]);

  const fetchAnalytics = async () => {
    if (!link) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnalytics(link.id, days);
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat analitik.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    const reportToken = data?.link.report_token || link?.report_token;
    if (!reportToken) return;
    const url = `${window.location.origin}/report/${reportToken}`;
    navigator.clipboard.writeText(url);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  if (!isOpen || !link) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl shadow-2xl my-auto max-h-[96dvh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-4 border-b border-zinc-800 gap-3 flex-shrink-0 bg-zinc-900">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-zinc-100">Analitik & Kinerja Tautan</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                  /{link.slug}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-[260px] sm:max-w-md mt-0.5">
                {link.title || link.target_url}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg sm:hidden transition-colors"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 border border-zinc-800 text-xs w-full sm:w-auto justify-center">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded font-medium transition-colors text-center ${
                    days === d ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {d} hari
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hidden sm:inline-flex transition-colors"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {loading && !data ? (
            <div className="py-20 text-center text-zinc-500 text-xs">
              Memuat data performa...
            </div>
          ) : error ? (
            <div className="p-3 bg-rose-950/40 text-rose-300 rounded-lg text-xs border border-rose-800/60">
              {error}
            </div>
          ) : (
            <>
              {/* Stat Cards Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-zinc-400" />
                    <span>Total Klik</span>
                  </div>
                  <div className="text-lg sm:text-2xl font-semibold text-zinc-100 tracking-tight">
                    {data?.summary.total_clicks.toLocaleString('id-ID') || 0}
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-zinc-400" />
                    <span>Pengunjung Unik</span>
                  </div>
                  <div className="text-lg sm:text-2xl font-semibold text-zinc-100 tracking-tight">
                    {data?.summary.unique_visitors.toLocaleString('id-ID') || 0}
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 text-zinc-400" />
                    <span>Rasio Kunjungan Ulang</span>
                  </div>
                  <div className="text-lg sm:text-2xl font-semibold text-zinc-100 tracking-tight">
                    {data?.summary.repeat_ratio ? `${(data.summary.repeat_ratio * 100).toFixed(0)}%` : '0%'}
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                  <div className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Sponsor CTR
                  </div>
                  <div className="text-lg sm:text-2xl font-semibold text-emerald-400 tracking-tight">
                    {data?.sponsor ? `${data.sponsor.ctr}%` : 'Direct'}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {data?.sponsor ? `${data.sponsor.cta_clicks} klik CTA` : 'Tanpa intervensi sponsor'}
                  </div>
                </div>
              </div>

              {/* Middle Section: Sponsor Performance & Traffic Timeline side by side on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
                
                {/* Sponsor Performance Card (Left: 5 cols if sponsor active, or full if none) */}
                {data?.sponsor && (
                  <div className="lg:col-span-5 p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                          <span className="text-xs font-semibold text-zinc-100">
                            Interaksi & Konversi Sponsor
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyReport}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300 hover:text-zinc-100 transition-colors"
                          title="Salin tautan laporan sponsor publik"
                        >
                          {copiedReport ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3 text-zinc-400" />}
                          <span>{copiedReport ? 'Tersalin' : 'Laporan Publik'}</span>
                        </button>
                      </div>

                      {/* 4 Mini Metrics */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Impresi Tayang</div>
                          <div className="text-sm font-semibold text-zinc-100">
                            {data.sponsor.impressions.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Klik CTA Sponsor</div>
                          <div className="text-sm font-semibold text-emerald-400">
                            {data.sponsor.cta_clicks.toLocaleString('id-ID')} ({data.sponsor.ctr}%)
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Lewati ke Target</div>
                          <div className="text-sm font-semibold text-zinc-200">
                            {data.sponsor.skips_proceeded.toLocaleString('id-ID')} ({data.sponsor.completion_rate}%)
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Drop-off / Keluar</div>
                          <div className="text-sm font-semibold text-zinc-400">
                            {data.sponsor.bounced.toLocaleString('id-ID')} ({data.sponsor.bounce_rate}%)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Funnel Progress Visualizer */}
                    {data.sponsor.impressions > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-zinc-900">
                        <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                          <span>Corong Alur Pengunjung:</span>
                          <span className="text-[10px] text-zinc-500">100% total tayangan</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${Math.min(100, data.sponsor.ctr)}%` }}
                            className="bg-emerald-400 h-full"
                            title={`Klik Sponsor: ${data.sponsor.ctr}%`}
                          />
                          <div
                            style={{ width: `${Math.min(100 - data.sponsor.ctr, data.sponsor.completion_rate)}%` }}
                            className="bg-zinc-500 h-full"
                            title={`Lewati ke Target: ${data.sponsor.completion_rate}%`}
                          />
                          <div
                            style={{ width: `${Math.max(0, 100 - data.sponsor.ctr - data.sponsor.completion_rate)}%` }}
                            className="bg-zinc-800 h-full"
                            title={`Drop-off: ${data.sponsor.bounce_rate}%`}
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-zinc-400 pt-0.5">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Klik ({data.sponsor.ctr}%)</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                            <span>Lanjut ({data.sponsor.completion_rate}%)</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                            <span>Bounce ({data.sponsor.bounce_rate}%)</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Chart (Right: 7 cols if sponsor active, 12 cols if none) */}
                <div className={`${data?.sponsor ? 'lg:col-span-7' : 'lg:col-span-12'} p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-2`}>
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-100">
                        Tren Kunjungan Harian ({days} Hari Terakhir)
                      </span>
                    </div>
                  </div>
                  
                  {data?.timeline && data.timeline.length > 0 ? (
                    <div className="h-56 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.timeline}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                            labelStyle={{ color: '#a1a1aa', fontSize: '11px' }}
                            itemStyle={{ fontSize: '11px', color: '#f4f4f5' }}
                          />
                          <Area type="monotone" dataKey="total_clicks" name="Total Klik" stroke="#a1a1aa" strokeWidth={1.5} fill="#27272a" />
                          <Area type="monotone" dataKey="unique_visitors" name="Pengunjung Unik" stroke="#71717a" strokeWidth={1.5} fill="#18181b" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-zinc-500 text-xs">
                      Belum ada data kunjungan dalam periode ini.
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom Breakdown Grids: 4 balanced columns on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Referrers */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-xs font-medium text-zinc-300">Sumber Referensi</div>
                  <div className="space-y-1.5">
                    {data?.breakdown.referrers && data.breakdown.referrers.length > 0 ? (
                      data.breakdown.referrers.slice(0, 5).map((item) => (
                        <div key={item.name} className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400 truncate max-w-[120px]">{item.name}</span>
                            <span className="text-zinc-500">{item.count} ({item.percentage}%)</span>
                          </div>
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-600 py-3 text-center">Belum ada data.</p>
                    )}
                  </div>
                </div>

                {/* Provinces */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-xs font-medium text-zinc-300">Wilayah (Provinsi)</div>
                  <div className="space-y-1.5">
                    {data?.breakdown.provinces && data.breakdown.provinces.length > 0 ? (
                      data.breakdown.provinces.slice(0, 5).map((item) => (
                        <div key={item.name} className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400 truncate max-w-[120px]">{item.name}</span>
                            <span className="text-zinc-500">{item.count} ({item.percentage}%)</span>
                          </div>
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-600 py-3 text-center">Belum ada data.</p>
                    )}
                  </div>
                </div>

                {/* ISPs */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-xs font-medium text-zinc-300">Operator Provider</div>
                  <div className="space-y-1.5">
                    {data?.breakdown.isps && data.breakdown.isps.length > 0 ? (
                      data.breakdown.isps.slice(0, 5).map((item) => (
                        <div key={item.name} className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400 truncate max-w-[120px]">{item.name}</span>
                            <span className="text-zinc-500">{item.count} ({item.percentage}%)</span>
                          </div>
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-600 py-3 text-center">Belum ada data.</p>
                    )}
                  </div>
                </div>

                {/* Devices */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-xs font-medium text-zinc-300">Perangkat</div>
                  <div className="space-y-1.5">
                    {data?.breakdown.devices && data.breakdown.devices.length > 0 ? (
                      data.breakdown.devices.slice(0, 5).map((item) => (
                        <div key={item.name} className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">{item.name}</span>
                            <span className="text-zinc-500">{item.count} ({item.percentage}%)</span>
                          </div>
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-600 py-3 text-center">Belum ada data.</p>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
