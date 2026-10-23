import { User, ShortLink, GlobalAdSettings, AnalyticsData } from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // include session cookies
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, any>;

  if (!response.ok) {
    const errorMsg = (data && (data.error || data.message)) || `Permintaan gagal (${response.status})`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async getMe(): Promise<{ authenticated: boolean; user: User | null }> {
    return request<{ authenticated: boolean; user: User | null }>('/auth/me');
  },

  async requestMagicLink(email: string): Promise<{ success: boolean; message: string; simulated?: boolean; devMagicLinkUrl?: string }> {
    return request<{ success: boolean; message: string; simulated?: boolean; devMagicLinkUrl?: string }>('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async verifyToken(token: string): Promise<{ success: boolean; authenticated: boolean; user?: User; error?: string }> {
    return request<{ success: boolean; authenticated: boolean; user?: User; error?: string }>(`/auth/verify?format=json&token=${encodeURIComponent(token)}`);
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST'
    });
  },

  // User & Global Ads
  async getGlobalAdSettings(): Promise<{ success: boolean; data: GlobalAdSettings }> {
    return request<{ success: boolean; data: GlobalAdSettings }>('/user/ad-settings');
  },

  async updateGlobalAdSettings(settings: Partial<GlobalAdSettings>): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/user/ad-settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  // Links
  async getLinks(): Promise<{ success: boolean; data: ShortLink[] }> {
    return request<{ success: boolean; data: ShortLink[] }>('/links');
  },

  async createLink(data: Partial<ShortLink>): Promise<{ success: boolean; message: string; data: ShortLink }> {
    return request<{ success: boolean; message: string; data: ShortLink }>('/links', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateLink(id: string, data: Partial<ShortLink>): Promise<{ success: boolean; message: string; data: ShortLink }> {
    return request<{ success: boolean; message: string; data: ShortLink }>(`/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async toggleLinkActive(id: string): Promise<{ success: boolean; is_active: boolean }> {
    return request<{ success: boolean; is_active: boolean }>(`/links/${id}/toggle-active`, {
      method: 'PATCH'
    });
  },

  async deleteLink(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/links/${id}`, {
      method: 'DELETE'
    });
  },

  // Analytics
  async getAnalytics(linkId: string, days = 30): Promise<{ success: boolean; data: AnalyticsData }> {
    return request<{ success: boolean; data: AnalyticsData }>(`/analytics/${linkId}?days=${days}`);
  },

  async getOverviewSummary(): Promise<{
    success: boolean;
    data: {
      total_links: number;
      total_clicks: number;
      total_uniques: number;
      sponsor_impressions: number;
      sponsor_cta_clicks: number;
      sponsor_skips: number;
      sponsor_ctr: number;
    };
  }> {
    return request<{
      success: boolean;
      data: {
        total_links: number;
        total_clicks: number;
        total_uniques: number;
        sponsor_impressions: number;
        sponsor_cta_clicks: number;
        sponsor_skips: number;
        sponsor_ctr: number;
      };
    }>('/analytics/summary/overview');
  },

  async getPublicReport(reportToken: string, days = 30): Promise<{ success: boolean; data: AnalyticsData }> {
    return request<{ success: boolean; data: AnalyticsData }>(`/analytics/report/${reportToken}?days=${days}`);
  }
};
