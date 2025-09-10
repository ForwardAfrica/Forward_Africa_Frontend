import { api } from './api';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  audience: 'all' | 'users' | 'instructors' | 'admins';
  status: 'draft' | 'published' | 'archived';
  created_by: number;
  created_by_name?: string;
  published_at?: string;
  expires_at?: string;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  content: string;
  audience: 'all' | 'users' | 'instructors' | 'admins' | 'custom';
  custom_audience_ids?: number[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounce_count: number;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PushNotification {
  id: number;
  title: string;
  message: string;
  audience: 'all' | 'users' | 'instructors' | 'admins' | 'custom';
  custom_audience_ids?: number[];
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  delivered_count: number;
  opened_count: number;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  variables?: string[];
  is_default: boolean;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationSettings {
  default_sender_email: string;
  default_sender_name: string;
  enable_email_notifications: string;
  enable_push_notifications: string;
  require_email_confirmation: string;
  enable_sms_notifications: string;
  email_daily_limit: string;
  notification_retention_days: string;
}

export interface CommunicationAnalytics {
  total_announcements: number;
  total_emails: number;
  total_notifications: number;
  delivery_rate: string;
  open_rate: string;
  click_rate: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AnnouncementsResponse {
  announcements: Announcement[];
  pagination: PaginationInfo;
}

export interface EmailCampaignsResponse {
  campaigns: EmailCampaign[];
  pagination: PaginationInfo;
}

export interface PushNotificationsResponse {
  notifications: PushNotification[];
  pagination: PaginationInfo;
}

export interface EmailTemplatesResponse {
  templates: EmailTemplate[];
}

export interface SettingsResponse {
  settings: CommunicationSettings;
}

export interface AnalyticsResponse {
  analytics: CommunicationAnalytics;
}

class CommunicationService {
  private baseUrl = '/api/communications';

  // ==================== ANNOUNCEMENTS ====================

  async getAnnouncements(params?: {
    page?: number;
    limit?: number;
    status?: string;
    audience?: string;
  }): Promise<AnnouncementsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.audience) queryParams.append('audience', params.audience);

    const response = await api.get(`${this.baseUrl}/announcements?${queryParams}`);
    return response.data;
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
    audience?: string;
    status?: string;
    expires_at?: string;
  }): Promise<{ message: string; id: number }> {
    const response = await api.post(`${this.baseUrl}/announcements`, data);
    return response.data;
  }

  async updateAnnouncement(id: number, data: {
    title: string;
    content: string;
    audience?: string;
    status?: string;
    expires_at?: string;
  }): Promise<{ message: string }> {
    const response = await api.put(`${this.baseUrl}/announcements/${id}`, data);
    return response.data;
  }

  async deleteAnnouncement(id: number): Promise<{ message: string }> {
    const response = await api.delete(`${this.baseUrl}/announcements/${id}`);
    return response.data;
  }

  // ==================== EMAIL CAMPAIGNS ====================

  async getEmailCampaigns(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<EmailCampaignsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response = await api.get(`${this.baseUrl}/email-campaigns?${queryParams}`);
    return response.data;
  }

  async createEmailCampaign(data: {
    name: string;
    subject: string;
    content: string;
    audience?: string;
    custom_audience_ids?: number[];
    scheduled_at?: string;
  }): Promise<{ message: string; id: number }> {
    const response = await api.post(`${this.baseUrl}/email-campaigns`, data);
    return response.data;
  }

  async sendEmailCampaign(id: number): Promise<{ message: string; recipients_count: number }> {
    const response = await api.post(`${this.baseUrl}/email-campaigns/${id}/send`);
    return response.data;
  }

  // ==================== PUSH NOTIFICATIONS ====================

  async getPushNotifications(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PushNotificationsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response = await api.get(`${this.baseUrl}/push-notifications?${queryParams}`);
    return response.data;
  }

  async createPushNotification(data: {
    title: string;
    message: string;
    audience?: string;
    custom_audience_ids?: number[];
    scheduled_at?: string;
  }): Promise<{ message: string; id: number }> {
    const response = await api.post(`${this.baseUrl}/push-notifications`, data);
    return response.data;
  }

  async sendPushNotification(id: number): Promise<{ message: string; recipients_count: number }> {
    const response = await api.post(`${this.baseUrl}/push-notifications/${id}/send`);
    return response.data;
  }

  // ==================== EMAIL TEMPLATES ====================

  async getEmailTemplates(): Promise<EmailTemplatesResponse> {
    const response = await api.get(`${this.baseUrl}/email-templates`);
    return response.data;
  }

  async createEmailTemplate(data: {
    name: string;
    subject: string;
    content: string;
    variables?: string[];
    is_default?: boolean;
  }): Promise<{ message: string; id: number }> {
    const response = await api.post(`${this.baseUrl}/email-templates`, data);
    return response.data;
  }

  // ==================== SETTINGS ====================

  async getSettings(): Promise<SettingsResponse> {
    const response = await api.get(`${this.baseUrl}/settings`);
    return response.data;
  }

  async updateSettings(settings: Partial<CommunicationSettings>): Promise<{ message: string }> {
    const response = await api.put(`${this.baseUrl}/settings`, settings);
    return response.data;
  }

  // ==================== ANALYTICS ====================

  async getAnalytics(): Promise<AnalyticsResponse> {
    const response = await api.get(`${this.baseUrl}/analytics`);
    return response.data;
  }
}

export const communicationService = new CommunicationService();