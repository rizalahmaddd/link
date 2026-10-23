import { Hono } from 'hono';
import { AppContext, ShortLink } from '../types';
import { getAuthenticatedUser } from '../services/auth';

export const analyticsRouter = new Hono<AppContext>();

// Public route: GET /api/v1/analytics/report/:reportToken (view-only report for clients & sponsors)
analyticsRouter.get('/report/:reportToken', async (c) => {
  const reportToken = c.req.param('reportToken');
  const days = Math.min(90, Math.max(7, Number(c.req.query('days')) || 30));
  const db = c.env.DB;

  if (!reportToken || !db) {
    return c.json({ success: false, error: 'Token laporan tidak valid.' }, 400);
  }

  const link = await db
    .prepare('SELECT id, slug, target_url, title, ad_mode, clicks_count, created_at, report_token FROM links WHERE report_token = ?')
    .bind(reportToken)
    .first<ShortLink>();

  if (!link) {
    return c.json({ success: false, error: 'Laporan sponsor tidak ditemukan.' }, 404);
  }

  // 1. Daily clicks
  const dailyRows = await db
    .prepare(`
      SELECT date, total_clicks, unique_visitors
      FROM link_clicks_daily
      WHERE link_id = ? AND date >= date('now', '-' || ? || ' days')
      ORDER BY date ASC
    `)
    .bind(link.id, days)
    .all<{ date: string; total_clicks: number; unique_visitors: number }>();

  // 2. Sponsor Ad Metrics
  const adRows = await db
    .prepare(`
      SELECT date, impressions, cta_clicks, skips_proceeded
      FROM link_ad_metrics_daily
      WHERE link_id = ? AND date >= date('now', '-' || ? || ' days')
      ORDER BY date ASC
    `)
    .bind(link.id, days)
    .all<{ date: string; impressions: number; cta_clicks: number; skips_proceeded: number }>();

  // 3. Breakdown
  const breakdownRows = await db
    .prepare(`
      SELECT category, name, count
      FROM link_analytics_breakdown
      WHERE link_id = ?
      ORDER BY count DESC
    `)
    .bind(link.id)
    .all<{ category: string; name: string; count: number }>();

  const referrers: Record<string, number> = {};
  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};
  const os: Record<string, number> = {};
  const provinces: Record<string, number> = {};
  const isps: Record<string, number> = {};

  for (const row of breakdownRows.results || []) {
    switch (row.category) {
      case 'referrer': referrers[row.name] = row.count; break;
      case 'device': devices[row.name] = row.count; break;
      case 'browser': browsers[row.name] = row.count; break;
      case 'os': os[row.name] = row.count; break;
      case 'province': provinces[row.name] = row.count; break;
      case 'isp': isps[row.name] = row.count; break;
    }
  }

  const totalImpressions = (adRows.results || []).reduce((acc, curr) => acc + (curr.impressions || 0), 0);
  const totalCtaClicks = (adRows.results || []).reduce((acc, curr) => acc + (curr.cta_clicks || 0), 0);
  const totalSkips = (adRows.results || []).reduce((acc, curr) => acc + (curr.skips_proceeded || 0), 0);
  const ctr = totalImpressions > 0 ? Number(((totalCtaClicks / totalImpressions) * 100).toFixed(1)) : 0;
  const completionRate = totalImpressions > 0 ? Number(((totalSkips / totalImpressions) * 100).toFixed(1)) : 0;
  const bounceCount = Math.max(0, totalImpressions - totalCtaClicks - totalSkips);
  const bounceRate = totalImpressions > 0 ? Number(((bounceCount / totalImpressions) * 100).toFixed(1)) : 0;

  const totalClicks = link.clicks_count || 0;
  const totalUniques = (dailyRows.results || []).reduce((acc, curr) => acc + (curr.unique_visitors || 0), 0);

  return c.json({
    success: true,
    data: {
      link: {
        id: link.id,
        slug: link.slug,
        target_url: link.target_url,
        title: link.title,
        ad_mode: link.ad_mode,
        clicks_count: link.clicks_count,
        created_at: link.created_at,
        report_token: link.report_token
      },
      summary: {
        total_clicks: totalClicks,
        unique_visitors: totalUniques,
        repeat_ratio: totalClicks > 0 ? Number(((totalClicks - totalUniques) / totalClicks).toFixed(2)) : 0
      },
      sponsor: {
        impressions: totalImpressions,
        cta_clicks: totalCtaClicks,
        skips_proceeded: totalSkips,
        bounced: bounceCount,
        ctr,
        completion_rate: completionRate,
        bounce_rate: bounceRate,
        timeline: adRows.results || []
      },
      timeline: dailyRows.results || [],
      breakdown: {
        referrers: formatBreakdown(referrers),
        devices: formatBreakdown(devices),
        browsers: formatBreakdown(browsers),
        os: formatBreakdown(os),
        provinces: formatBreakdown(provinces),
        isps: formatBreakdown(isps)
      }
    }
  });
});

// Auth middleware for private analytics
analyticsRouter.use('*', async (c, next) => {
  const user = await getAuthenticatedUser(c.req.raw, c.env);
  if (!user) {
    return c.json({ success: false, error: 'Silakan login terlebih dahulu.' }, 401);
  }
  c.set('user', user);
  await next();
});

// GET /api/v1/analytics/summary/overview - Top metric strip for dashboard
analyticsRouter.get('/summary/overview', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  const linkCountRow = await db
    .prepare('SELECT COUNT(*) as count FROM links WHERE user_id = ?')
    .bind(user.id)
    .first<{ count: number }>();
  const totalLinks = linkCountRow?.count || 0;

  const totalClicksRow = await db
    .prepare('SELECT SUM(clicks_count) as total FROM links WHERE user_id = ?')
    .bind(user.id)
    .first<{ total: number }>();
  const totalClicks = totalClicksRow?.total || 0;

  const totalUniquesRow = await db
    .prepare(`
      SELECT SUM(d.unique_visitors) as total_uniques
      FROM link_clicks_daily d
      JOIN links l ON l.id = d.link_id
      WHERE l.user_id = ? AND d.date >= date('now', '-30 days')
    `)
    .bind(user.id)
    .first<{ total_uniques: number }>();
  const totalUniques = totalUniquesRow?.total_uniques || 0;

  const sponsorMetricsRow = await db
    .prepare(`
      SELECT 
        SUM(m.impressions) as impressions,
        SUM(m.cta_clicks) as cta_clicks,
        SUM(m.skips_proceeded) as skips
      FROM link_ad_metrics_daily m
      JOIN links l ON l.id = m.link_id
      WHERE l.user_id = ? AND m.date >= date('now', '-30 days')
    `)
    .bind(user.id)
    .first<{ impressions: number; cta_clicks: number; skips: number }>();

  const impressions = sponsorMetricsRow?.impressions || 0;
  const ctaClicks = sponsorMetricsRow?.cta_clicks || 0;
  const skips = sponsorMetricsRow?.skips || 0;
  const ctr = impressions > 0 ? Number(((ctaClicks / impressions) * 100).toFixed(1)) : 0;

  return c.json({
    success: true,
    data: {
      total_links: totalLinks,
      total_clicks: totalClicks,
      total_uniques: totalUniques,
      sponsor_impressions: impressions,
      sponsor_cta_clicks: ctaClicks,
      sponsor_skips: skips,
      sponsor_ctr: ctr
    }
  });
});

// GET /api/v1/analytics/:linkId - Detailed link analytics
analyticsRouter.get('/:linkId', async (c) => {
  const user = c.get('user');
  const linkId = c.req.param('linkId');
  const days = Math.min(90, Math.max(7, Number(c.req.query('days')) || 30));
  const db = c.env.DB;

  // Verify ownership
  const link = await db
    .prepare('SELECT * FROM links WHERE id = ? AND user_id = ?')
    .bind(linkId, user.id)
    .first<ShortLink>();

  if (!link) {
    return c.json({ success: false, error: 'Tautan tidak ditemukan.' }, 404);
  }

  // 1. Timeline: Daily clicks & Unique visitors
  const dailyRows = await db
    .prepare(`
      SELECT date, total_clicks, unique_visitors
      FROM link_clicks_daily
      WHERE link_id = ? AND date >= date('now', '-' || ? || ' days')
      ORDER BY date ASC
    `)
    .bind(linkId, days)
    .all<{ date: string; total_clicks: number; unique_visitors: number }>();

  // 2. Sponsor Ad Metrics
  const adRows = await db
    .prepare(`
      SELECT date, impressions, cta_clicks, skips_proceeded
      FROM link_ad_metrics_daily
      WHERE link_id = ? AND date >= date('now', '-' || ? || ' days')
      ORDER BY date ASC
    `)
    .bind(linkId, days)
    .all<{ date: string; impressions: number; cta_clicks: number; skips_proceeded: number }>();

  const totalImpressions = (adRows.results || []).reduce((acc, curr) => acc + (curr.impressions || 0), 0);
  const totalCtaClicks = (adRows.results || []).reduce((acc, curr) => acc + (curr.cta_clicks || 0), 0);
  const totalSkips = (adRows.results || []).reduce((acc, curr) => acc + (curr.skips_proceeded || 0), 0);
  const ctr = totalImpressions > 0 ? Number(((totalCtaClicks / totalImpressions) * 100).toFixed(1)) : 0;
  const completionRate = totalImpressions > 0 ? Number(((totalSkips / totalImpressions) * 100).toFixed(1)) : 0;
  const bounceCount = Math.max(0, totalImpressions - totalCtaClicks - totalSkips);
  const bounceRate = totalImpressions > 0 ? Number(((bounceCount / totalImpressions) * 100).toFixed(1)) : 0;

  // 3. Breakdown Dimensions
  const breakdownRows = await db
    .prepare(`
      SELECT category, name, count
      FROM link_analytics_breakdown
      WHERE link_id = ?
      ORDER BY count DESC
    `)
    .bind(linkId)
    .all<{ category: string; name: string; count: number }>();

  const referrers: Record<string, number> = {};
  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};
  const os: Record<string, number> = {};
  const provinces: Record<string, number> = {};
  const isps: Record<string, number> = {};

  for (const row of breakdownRows.results || []) {
    switch (row.category) {
      case 'referrer': referrers[row.name] = row.count; break;
      case 'device': devices[row.name] = row.count; break;
      case 'browser': browsers[row.name] = row.count; break;
      case 'os': os[row.name] = row.count; break;
      case 'province': provinces[row.name] = row.count; break;
      case 'isp': isps[row.name] = row.count; break;
    }
  }

  // Calculate totals
  const totalClicks = link.clicks_count || 0;
  const totalUniques = (dailyRows.results || []).reduce((acc, curr) => acc + (curr.unique_visitors || 0), 0);

  return c.json({
    success: true,
    data: {
      link: {
        id: link.id,
        slug: link.slug,
        target_url: link.target_url,
        title: link.title,
        ad_mode: link.ad_mode,
        ad_skippable: link.ad_skippable,
        clicks_count: link.clicks_count,
        report_token: link.report_token,
        created_at: link.created_at
      },
      summary: {
        total_clicks: totalClicks,
        unique_visitors: totalUniques,
        repeat_ratio: totalClicks > 0 ? Number(((totalClicks - totalUniques) / totalClicks).toFixed(2)) : 0
      },
      sponsor: {
        impressions: totalImpressions,
        cta_clicks: totalCtaClicks,
        skips_proceeded: totalSkips,
        bounced: bounceCount,
        ctr,
        completion_rate: completionRate,
        bounce_rate: bounceRate,
        timeline: adRows.results || []
      },
      timeline: dailyRows.results || [],
      breakdown: {
        referrers: formatBreakdown(referrers),
        devices: formatBreakdown(devices),
        browsers: formatBreakdown(browsers),
        os: formatBreakdown(os),
        provinces: formatBreakdown(provinces),
        isps: formatBreakdown(isps)
      }
    }
  });
});

function formatBreakdown(map: Record<string, number>): Array<{ name: string; count: number; percentage: number }> {
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return Object.entries(map)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count);
}
