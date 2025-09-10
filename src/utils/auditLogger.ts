import { AuditLog } from '../types';

/**
 * Audit Logger Utility
 * Tracks all administrative actions for security and compliance
 */

interface AuditLogData {
  user_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
}

class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLog[] = [];

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an administrative action
   */
  async logAction(data: AuditLogData): Promise<void> {
    const log: AuditLog = {
      id: this.generateId(),
      user_id: data.user_id,
      user_email: data.user_email,
      action: data.action,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      details: data.details,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      created_at: new Date().toISOString()
    };

    this.logs.push(log);

    // In a real application, this would send to a backend API
    try {
      await this.sendToBackend(log);
    } catch (error) {
      console.error('Failed to send audit log to backend:', error);
      // Store locally as fallback
      this.storeLocally(log);
    }
  }

  /**
   * Log user role changes
   */
  async logRoleChange(
    adminUserId: string,
    adminEmail: string,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logAction({
      user_id: adminUserId,
      user_email: adminEmail,
      action: 'role_changed',
      resource_type: 'user',
      resource_id: targetUserId,
      details: {
        target_user_id: targetUserId,
        old_role: oldRole,
        new_role: newRole,
        change_type: 'role_assignment'
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log user status changes
   */
  async logUserStatusChange(
    adminUserId: string,
    adminEmail: string,
    targetUserId: string,
    oldStatus: boolean,
    newStatus: boolean,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logAction({
      user_id: adminUserId,
      user_email: adminEmail,
      action: 'user_status_changed',
      resource_type: 'user',
      resource_id: targetUserId,
      details: {
        target_user_id: targetUserId,
        old_status: oldStatus ? 'active' : 'inactive',
        new_status: newStatus ? 'active' : 'inactive',
        change_type: newStatus ? 'user_activated' : 'user_suspended'
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log user deletion
   */
  async logUserDeletion(
    adminUserId: string,
    adminEmail: string,
    targetUserId: string,
    targetEmail: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logAction({
      user_id: adminUserId,
      user_email: adminEmail,
      action: 'user_deleted',
      resource_type: 'user',
      resource_id: targetUserId,
      details: {
        target_user_id: targetUserId,
        target_user_email: targetEmail,
        deletion_reason: 'admin_action'
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log permission changes
   */
  async logPermissionChange(
    adminUserId: string,
    adminEmail: string,
    targetUserId: string,
    oldPermissions: string[],
    newPermissions: string[],
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logAction({
      user_id: adminUserId,
      user_email: adminEmail,
      action: 'permissions_changed',
      resource_type: 'user',
      resource_id: targetUserId,
      details: {
        target_user_id: targetUserId,
        old_permissions: oldPermissions,
        new_permissions: newPermissions,
        added_permissions: newPermissions.filter(p => !oldPermissions.includes(p)),
        removed_permissions: oldPermissions.filter(p => !newPermissions.includes(p))
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log login attempts
   */
  async logLoginAttempt(
    userId: string,
    userEmail: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    failureReason?: string
  ): Promise<void> {
    await this.logAction({
      user_id: userId,
      user_email: userEmail,
      action: success ? 'login_success' : 'login_failed',
      resource_type: 'auth',
      details: {
        success,
        failure_reason: failureReason,
        login_method: 'email_password'
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log password changes
   */
  async logPasswordChange(
    userId: string,
    userEmail: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logAction({
      user_id: userId,
      user_email: userEmail,
      action: 'password_changed',
      resource_type: 'auth',
      details: {
        change_type: 'user_initiated',
        security_level: 'standard'
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log content management actions
   */
  async logContentAction(
    userId: string,
    userEmail: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, any>,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logAction({
      user_id: userId,
      user_email: userEmail,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserLogs(userId: string, limit: number = 50): Promise<AuditLog[]> {
    // In a real application, this would fetch from backend
    return this.logs
      .filter(log => log.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceLogs(resourceType: string, resourceId: string, limit: number = 50): Promise<AuditLog[]> {
    // In a real application, this would fetch from backend
    return this.logs
      .filter(log => log.resource_type === resourceType && log.resource_id === resourceId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Get all audit logs with filtering
   */
  async getAllLogs(filters?: {
    action?: string;
    resource_type?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
  }, limit: number = 100): Promise<AuditLog[]> {
    // In a real application, this would fetch from backend with proper filtering
    let filteredLogs = this.logs;

    if (filters?.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    if (filters?.resource_type) {
      filteredLogs = filteredLogs.filter(log => log.resource_type === filters.resource_type);
    }

    if (filters?.user_id) {
      filteredLogs = filteredLogs.filter(log => log.user_id === filters.user_id);
    }

    if (filters?.start_date) {
      filteredLogs = filteredLogs.filter(log => log.created_at >= filters.start_date!);
    }

    if (filters?.end_date) {
      filteredLogs = filteredLogs.filter(log => log.created_at <= filters.end_date!);
    }

    return filteredLogs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Export audit logs
   */
  async exportLogs(filters?: any, format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = await this.getAllLogs(filters, 1000);

    if (format === 'csv') {
      return this.convertToCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async sendToBackend(log: AuditLog): Promise<void> {
    // Simulate API call to backend
    const response = await fetch('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(log),
    });

    if (!response.ok) {
      throw new Error('Failed to send audit log to backend');
    }
  }

  private storeLocally(log: AuditLog): void {
    if (typeof window === 'undefined') return;

    const storedLogs = localStorage.getItem('audit_logs');
    const logs = storedLogs ? JSON.parse(storedLogs) : [];
    logs.push(log);

    // Keep only last 1000 logs locally
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }

    localStorage.setItem('audit_logs', JSON.stringify(logs));
  }

  private convertToCSV(logs: AuditLog[]): string {
    const headers = ['ID', 'User ID', 'User Email', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address', 'User Agent', 'Created At'];
    const rows = logs.map(log => [
      log.id,
      log.user_id,
      log.user_email,
      log.action,
      log.resource_type,
      log.resource_id || '',
      JSON.stringify(log.details),
      log.ip_address,
      log.user_agent,
      log.created_at
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Convenience functions for common audit actions
export const logRoleChange = auditLogger.logRoleChange.bind(auditLogger);
export const logUserStatusChange = auditLogger.logUserStatusChange.bind(auditLogger);
export const logUserDeletion = auditLogger.logUserDeletion.bind(auditLogger);
export const logPermissionChange = auditLogger.logPermissionChange.bind(auditLogger);
export const logLoginAttempt = auditLogger.logLoginAttempt.bind(auditLogger);
export const logPasswordChange = auditLogger.logPasswordChange.bind(auditLogger);
export const logContentAction = auditLogger.logContentAction.bind(auditLogger);