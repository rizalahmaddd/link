export interface User {
  id: string;
  email: string;
  global_ad_enabled: boolean;
  global_ad_type: 'none' | 'image' | 'youtube';
  global_ad_media_url: string | null;
  global_ad_headline: string | null;
  global_ad_timer_seconds: number;
  global_ad_cta_text: string | null;
  global_ad_cta_url: string | null;
  global_ad_skippable?: boolean;
  global_ad_auto_redirect?: boolean;
  created_at?: string;
}

export interface ShortLink {
  id: string;
  user_id: string;
  slug: string;
  target_url: string;
  title: string | null;
  description: string | null;
  ad_mode: 'inherit' | 'custom' | 'disabled';
  ad_type: 'none' | 'image' | 'youtube';
  ad_media_url: string | null;
  ad_headline: string | null;
  ad_timer_seconds: number;
  ad_cta_text: string | null;
  ad_cta_url: string | null;
  ad_skippable?: number | boolean;
  ad_auto_redirect?: number | boolean;
  has_password?: boolean;
  password?: string;
  expires_at?: string | null;
  max_clicks?: number | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  report_token?: string | null;
  qr_config: string | null;
  is_active: number | boolean;
  clicks_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface GlobalAdSettings {
  global_ad_enabled: boolean;
  global_ad_type: 'none' | 'image' | 'youtube';
  global_ad_media_url: string;
  global_ad_headline: string;
  global_ad_timer_seconds: number;
  global_ad_cta_text: string;
  global_ad_cta_url: string;
  global_ad_skippable?: boolean;
  global_ad_auto_redirect?: boolean;
}

export interface BreakdownItem {
  name: string;
  count: number;
  percentage: number;
}

export interface SponsorMetrics {
  impressions: number;
  cta_clicks: number;
  skips_proceeded: number;
  bounced: number;
  ctr: number;
  completion_rate: number;
  bounce_rate: number;
  timeline: Array<{
    date: string;
    impressions: number;
    cta_clicks: number;
    skips_proceeded: number;
  }>;
}

export interface AnalyticsData {
  link: {
    id: string;
    slug: string;
    target_url: string;
    title: string | null;
    ad_mode: string;
    ad_skippable?: boolean | number;
    clicks_count: number;
    report_token?: string | null;
    created_at?: string;
  };
  summary: {
    total_clicks: number;
    unique_visitors: number;
    repeat_ratio: number;
  };
  sponsor?: SponsorMetrics;
  timeline: Array<{
    date: string;
    total_clicks: number;
    unique_visitors: number;
  }>;
  breakdown: {
    referrers: BreakdownItem[];
    devices: BreakdownItem[];
    browsers: BreakdownItem[];
    os: BreakdownItem[];
    provinces: BreakdownItem[];
    isps: BreakdownItem[];
  };
}

export interface QRConfig {
  fgColor: string;
  bgColor: string;
  includeMargin: boolean;
  logo: 'none' | 'whatsapp' | 'instagram' | 'shopee' | 'tokopedia' | 'bolt';
}
