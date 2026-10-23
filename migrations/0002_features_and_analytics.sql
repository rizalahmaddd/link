-- Migration 0002: Sponsor Telemetry, Skip Settings, and Advanced Link Controls

-- 1. Add skip, expiration, password, social og, and report token columns to links
ALTER TABLE links ADD COLUMN ad_skippable INTEGER DEFAULT 1;
ALTER TABLE links ADD COLUMN ad_auto_redirect INTEGER DEFAULT 0;
ALTER TABLE links ADD COLUMN password_hash TEXT DEFAULT NULL;
ALTER TABLE links ADD COLUMN expires_at DATETIME DEFAULT NULL;
ALTER TABLE links ADD COLUMN max_clicks INTEGER DEFAULT NULL;
ALTER TABLE links ADD COLUMN og_title TEXT DEFAULT NULL;
ALTER TABLE links ADD COLUMN og_description TEXT DEFAULT NULL;
ALTER TABLE links ADD COLUMN og_image_url TEXT DEFAULT NULL;
ALTER TABLE links ADD COLUMN report_token TEXT DEFAULT NULL;

-- 2. Add skip and redirect settings to users for global ads
ALTER TABLE users ADD COLUMN global_ad_skippable INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN global_ad_auto_redirect INTEGER DEFAULT 0;

-- 3. Create Daily Sponsor Ad Metrics Table for aggregated telemetry
CREATE TABLE IF NOT EXISTS link_ad_metrics_daily (
    id TEXT PRIMARY KEY,
    link_id TEXT NOT NULL,
    date TEXT NOT NULL,
    impressions INTEGER DEFAULT 0,
    cta_clicks INTEGER DEFAULT 0,
    skips_proceeded INTEGER DEFAULT 0,
    UNIQUE(link_id, date),
    FOREIGN KEY(link_id) REFERENCES links(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_link_date ON link_ad_metrics_daily(link_id, date);

-- 4. Generate report tokens for any existing links
UPDATE links SET report_token = lower(hex(randomblob(8))) WHERE report_token IS NULL;
