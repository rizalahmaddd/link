-- Link D1 Database Schema v1.0
-- 100% Cloudflare Free Tier Optimized (Aggregated Metrics to preserve write quota)

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    global_ad_enabled INTEGER DEFAULT 0,
    global_ad_type TEXT DEFAULT 'none' CHECK(global_ad_type IN ('none', 'image', 'youtube')),
    global_ad_media_url TEXT,
    global_ad_headline TEXT,
    global_ad_timer_seconds INTEGER DEFAULT 5,
    global_ad_cta_text TEXT,
    global_ad_cta_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS magic_links (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    consumed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token_hash);

CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    ad_mode TEXT DEFAULT 'inherit' CHECK(ad_mode IN ('inherit', 'custom', 'disabled')),
    ad_type TEXT DEFAULT 'none' CHECK(ad_type IN ('none', 'image', 'youtube')),
    ad_media_url TEXT,
    ad_headline TEXT,
    ad_timer_seconds INTEGER DEFAULT 5,
    ad_cta_text TEXT,
    ad_cta_url TEXT,
    qr_config TEXT,
    is_active INTEGER DEFAULT 1,
    clicks_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
CREATE INDEX IF NOT EXISTS idx_links_user ON links(user_id);

CREATE TABLE IF NOT EXISTS link_clicks_daily (
    id TEXT PRIMARY KEY,
    link_id TEXT NOT NULL,
    date TEXT NOT NULL,
    total_clicks INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    UNIQUE(link_id, date),
    FOREIGN KEY(link_id) REFERENCES links(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS link_analytics_breakdown (
    id TEXT PRIMARY KEY,
    link_id TEXT NOT NULL,
    category TEXT NOT NULL, -- 'referrer', 'device', 'browser', 'os', 'province', 'isp'
    name TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    UNIQUE(link_id, category, name),
    FOREIGN KEY(link_id) REFERENCES links(id) ON DELETE CASCADE
);
