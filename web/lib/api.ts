/**
 * API Client for SwellMind Backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private getAuthHeader(): HeadersInit {
    if (typeof window === 'undefined') return {};
    
    const token = localStorage.getItem('swellmind_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async signup(email: string, password: string, displayName?: string) {
    const data = await this.request<{ user: any; session: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
    
    if (data.session?.access_token) {
      localStorage.setItem('swellmind_token', data.session.access_token);
    }
    
    return data;
  }

  async signin(email: string, password: string) {
    const data = await this.request<{ user: any; session: any }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.session?.access_token) {
      localStorage.setItem('swellmind_token', data.session.access_token);
    }
    
    return data;
  }

  async signout() {
    await this.request('/auth/signout', { method: 'POST' });
    localStorage.removeItem('swellmind_token');
  }

  async getProfile() {
    return this.request<{ user: any; favorite_spots: any[]; model_stats: any }>('/auth/me');
  }

  // Spots
  async getSpots(region?: string) {
    const query = region ? `?region=${region}` : '';
    return this.request<{ spots: any[] }>(`/spots${query}`);
  }

  async getSpotWindows(spotId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString() ? `?${params}` : '';
    
    return this.request<{ spot: any; windows: any[]; cached: boolean }>(`/spots/${spotId}/windows${query}`);
  }

  async getSpotForecast(spotId: string) {
    return this.request<{ spot: any; windows: any[]; cached: boolean }>(`/spots/${spotId}/windows`);
  }

  // Sessions
  async logSession(data: {
    spot_id: string;
    surf_timestamp_utc: string;
    overall_rating: number;
    perceived_wind?: string;
    perceived_size?: number;
    perceived_crowd?: number;
    notes?: string;
  }) {
    return this.request<{ session: any; message: string }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSessions(limit = 20, offset = 0) {
    return this.request<{ sessions: any[]; total: number }>(`/sessions/me?limit=${limit}&offset=${offset}`);
  }

  // Insights
  async getInsights() {
    return this.request<any>('/insights/me');
  }
}

export const api = new ApiClient();
