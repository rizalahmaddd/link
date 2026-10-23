export interface Env {
  DB: D1Database;
  LINKS_KV: KVNamespace;
  ASSETS?: Fetcher;
  JWT_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  APP_URL?: string;
  ENVIRONMENT?: string;
}

export interface User {
  id: string;
  email: string;
  global_ad_enabled: number;
  global_ad_type: 'none' | 'image' | 'youtube';
  global_ad_media_url: string | null;
  global_ad_headline: string | null;
  global_ad_timer_seconds: number;
  global_ad_cta_text: string | null;
  global_ad_cta_url: string | null;
  global_ad_skippable?: number;
  global_ad_auto_redirect?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserKVAdProfile {
  global_enabled: boolean;
  type: 'none' | 'image' | 'youtube';
  media_url: string;
  headline: string;
  timer_seconds: number;
  cta_text: string;
  cta_url: string;
  skippable?: boolean;
  auto_redirect?: boolean;
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
  ad_skippable?: number;
  ad_auto_redirect?: number;
  password_hash?: string | null;
  expires_at?: string | null;
  max_clicks?: number | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  report_token?: string | null;
  qr_config: string | null;
  is_active: number;
  clicks_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface KVLinkRecord {
  id: string;
  user_id: string;
  target_url: string;
  title?: string;
  ad_mode: 'inherit' | 'custom' | 'disabled';
  ad_skippable?: boolean;
  ad_auto_redirect?: boolean;
  password_hash?: string | null;
  expires_at?: string | null;
  max_clicks?: number | null;
  clicks_count?: number;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  report_token?: string | null;
  custom_ad?: {
    type: 'none' | 'image' | 'youtube';
    media_url: string;
    headline: string;
    timer_seconds: number;
    cta_text: string;
    cta_url: string;
    skippable?: boolean;
    auto_redirect?: boolean;
  };
  is_active: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  exp: number;
}

export interface AppContext {
  Bindings: Env;
  Variables: {
    user: User;
  };
}

