import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AnalyticsData } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ExternalLink, CheckCircle2, ArrowLeft, BarChart3, TrendingUp, Users, Sparkles } from 'lucide-react';

interface PublicReportPageProps {
  reportToken: string;
}

export const PublicReportPage: React.FC<PublicReportPageProps> = ({ reportToken }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [reportToken, days]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPublicReport(reportToken, days);
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Laporan sponsor tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 font-semibold text-sm">
          L
        </div>
        <span className="text-xs text-zinc-500 font-mono">Memuat laporan sponsor...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto text-sm font-semibold">
            !
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-100">Laporan Tidak Ditemukan</h1>
            <p className="text-xs text-zinc-400 mt-1">{error || 'Tautan laporan mungkin tidak valid atau telah dihapus.'}</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ke Beranda</span>
          </a>
        </div>
      </div>
    );
  }

  const { link, summary, sponsor, timeline, breakdown } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800 selection:text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-xs">
                L
              </div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Laporan Kinerja Sponsor
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
                Terverifikasi
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-100 tracking-tight">
              {link.title || `Tautan /${link.slug}`}
            </h1>
            <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
              <span>Tujuan:</span>
              <a
                href={link.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white underline truncate max-w-xs sm:max-w-md inline-flex items-center gap-1 transition-colors"
              >
                <span>{link.target_url}</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    days === d ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {d} hari
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
              <span>Total Kunjungan</span>
            </div>
            <div className="text-2xl font-bold text-zinc-100 tracking-tight">
              {summary.total_clicks.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Dalam rentang {days} hari terakhir</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span>Pengunjung Unik</span>
            </div>
            <div className="text-2xl font-bold text-zinc-100 tracking-tight">
              {summary.unique_visitors.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">IP & user-agent terdeduplikasi</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sponsor CTR</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {sponsor ? `${sponsor.ctr}%` : 'Direct'}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {sponsor ? `${sponsor.cta_clicks.toLocaleString('id-ID')} klik langsung ke penawaran` : 'Tanpa jeda iklan'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
              Penyelesaian Tayangan
            </div>
            <div className="text-2xl font-bold text-zinc-200 tracking-tight">
              {sponsor ? `${sponsor.completion_rate}%` : '100%'}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Pengunjung yang lanjut ke tujuan</div>
          </div>
        </div>

        {/* Section Grid: Sponsor Engagement & Daily Trend side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Sponsor Engagement Performance Card */}
          {sponsor ? (
            <section className="lg:col-span-6 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">Metrik Interaksi Sponsor</h2>
                  <p className="text-xs text-zinc-400">Data tayangan iklan dan respon nyata dari pengunjung.</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Rasio CTR</div>
                  <div className="text-base font-bold text-emerald-400">{sponsor.ctr}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-1">
                    Impresi Tayang
                  </div>
                  <div className="text-lg font-bold text-zinc-100">
                    {sponsor.impressions.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-1">
                    Klik ke Sponsor
                  </div>
                  <div className="text-lg font-bold text-emerald-400">
                    {sponsor.cta_clicks.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-1">
                    Lewati ke Target
                  </div>
                  <div className="text-lg font-bold text-zinc-200">
                    {sponsor.skips_proceeded.toLocaleString('id-ID')}
                    <span className="text-[11px] font-normal text-zinc-500 ml-1">({sponsor.completion_rate}%)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-1">
                    Drop-off / Keluar
                  </div>
                  <div className="text-lg font-bold text-zinc-400">
                    {sponsor.bounced.toLocaleString('id-ID')}
                    <span className="text-[11px] font-normal text-zinc-500 ml-1">({sponsor.bounce_rate}%)</span>
                  </div>
                </div>
              </div>

              {/* Funnel Progress */}
              {sponsor.impressions > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Distribusi Konversi Pengunjung:</span>
                    <span className="text-zinc-500 text-[11px]">100% total tayangan</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.min(100, sponsor.ctr)}%` }}
                      className="bg-emerald-400 h-full"
                      title={`Klik Sponsor: ${sponsor.ctr}%`}
                    />
                    <div
                      style={{ width: `${Math.min(100 - sponsor.ctr, sponsor.completion_rate)}%` }}
                      className="bg-zinc-500 h-full"
                      title={`Lewati: ${sponsor.completion_rate}%`}
                    />
                    <div
                      style={{ width: `${Math.max(0, 100 - sponsor.ctr - sponsor.completion_rate)}%` }}
                      className="bg-zinc-800 h-full"
                      title={`Drop-off: ${sponsor.bounce_rate}%`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] text-zinc-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Klik Sponsor: {sponsor.cta_clicks} ({sponsor.ctr}%)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-500" />
                      <span>Lanjut ke Target: {sponsor.skips_proceeded} ({sponsor.completion_rate}%)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-800" />
                      <span>Drop-off: {sponsor.bounced} ({sponsor.bounce_rate}%)</span>
                    </span>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {/* Daily Trend Chart */}
          <section className={`${sponsor ? 'lg:col-span-6' : 'lg:col-span-12'} p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-3`}>
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-100">Tren Kunjungan Harian ({days} Hari)</h2>
              </div>
            </div>

            {timeline && timeline.length > 0 ? (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline}>
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
              <p className="text-xs text-zinc-500 py-16 text-center">Belum ada data kunjungan.</p>
            )}
          </section>

        </div>

        {/* Demographic & Tech Breakdown: 4 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Referrers */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-200">Sumber Referensi</h3>
            <div className="space-y-1.5 pt-1">
              {breakdown.referrers && breakdown.referrers.length > 0 ? (
                breakdown.referrers.slice(0, 5).map((item) => (
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
                <p className="text-xs text-zinc-600 py-4 text-center">Belum ada data referensi.</p>
              )}
            </div>
          </div>

          {/* Provinces */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-200">Lokasi Pengunjung (Provinsi)</h3>
            <div className="space-y-1.5 pt-1">
              {breakdown.provinces && breakdown.provinces.length > 0 ? (
                breakdown.provinces.slice(0, 5).map((item) => (
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
                <p className="text-xs text-zinc-600 py-4 text-center">Belum ada data lokasi.</p>
              )}
            </div>
          </div>

          {/* ISPs */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-200">Operator Provider</h3>
            <div className="space-y-1.5 pt-1">
              {breakdown.isps && breakdown.isps.length > 0 ? (
                breakdown.isps.slice(0, 5).map((item) => (
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
                <p className="text-xs text-zinc-600 py-4 text-center">Belum ada data operator.</p>
              )}
            </div>
          </div>

          {/* Devices */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-200">Tipe Perangkat</h3>
            <div className="space-y-1.5 pt-1">
              {breakdown.devices && breakdown.devices.length > 0 ? (
                breakdown.devices.map((item) => (
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
                <p className="text-xs text-zinc-600 py-4 text-center">Belum ada data perangkat.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-6 pb-12 text-center text-xs text-zinc-500">
          Laporan dibuat secara otomatis melalui platform <a href="/" className="text-zinc-400 hover:text-white underline">Link</a>.
        </footer>

      </div>
    </div>
  );
};
