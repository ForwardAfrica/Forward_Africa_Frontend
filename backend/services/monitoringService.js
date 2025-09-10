// Monitoring and Logging Service for Forward Africa API
// Provides comprehensive monitoring, logging, and alerting capabilities

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class MonitoringService extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: new Map(),
        byMethod: new Map(),
        byStatus: new Map()
      },
      performance: {
        responseTimes: [],
        averageResponseTime: 0,
        slowQueries: []
      },
      errors: {
        total: 0,
        byType: new Map(),
        recent: []
      },
      users: {
        active: new Set(),
        total: 0,
        new: 0
      },
      system: {
        memory: [],
        cpu: [],
        uptime: Date.now()
      }
    };

    this.config = {
      logLevel: process.env.LOG_LEVEL || 'info',
      logFile: process.env.LOG_FILE || 'logs/app.log',
      metricsFile: process.env.METRICS_FILE || 'logs/metrics.json',
      alertThresholds: {
        errorRate: 0.05, // 5% error rate
        responseTime: 2000, // 2 seconds
        memoryUsage: 0.9, // 90% memory usage
        cpuUsage: 0.8 // 80% CPU usage
      },
      retention: {
        logs: 30, // days
        metrics: 7 // days
      }
    };

    this.initialize();
  }

  initialize() {
    // Create logs directory if it doesn't exist
    const logsDir = path.dirname(this.config.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Initialize log rotation
    this.setupLogRotation();

    // Start system monitoring
    this.startSystemMonitoring();

    // Setup periodic metrics export
    this.setupMetricsExport();

    this.log('info', 'Monitoring service initialized', { config: this.config });
  }

  // Logging methods
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      data,
      pid: process.pid,
      memory: process.memoryUsage()
    };

    // Console logging
    if (this.shouldLogToConsole(level)) {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data);
    }

    // File logging
    this.writeToLogFile(logEntry);

    // Emit event for external listeners
    this.emit('log', logEntry);

    // Check for alerts
    this.checkAlerts(level, message, data);
  }

  shouldLogToConsole(level) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const configLevel = levels[this.config.logLevel] || 2;
    return levels[level] <= configLevel;
  }

  writeToLogFile(logEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.config.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Request monitoring
  trackRequest(req, res, next) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);

    // Track request metrics
    this.metrics.requests.total++;
    this.incrementMetric(this.metrics.requests.byEndpoint, req.path);
    this.incrementMetric(this.metrics.requests.byMethod, req.method);

    // Track user activity
    if (req.user) {
      this.metrics.users.active.add(req.user.id);
    }

    // Use res.on('finish') to avoid conflicts with other middleware
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Track response metrics
      if (statusCode >= 200 && statusCode < 400) {
        this.metrics.requests.successful++;
      } else {
        this.metrics.requests.failed++;
      }

      this.incrementMetric(this.metrics.requests.byStatus, statusCode);

      // Track performance
      this.metrics.performance.responseTimes.push(duration);
      this.updateAverageResponseTime();

      // Log slow queries
      if (duration > this.config.alertThresholds.responseTime) {
        this.metrics.performance.slowQueries.push({
          requestId,
          path: req.path,
          method: req.method,
          duration,
          timestamp: new Date().toISOString()
        });
      }

      // Log request
      this.log('info', 'Request completed', {
        requestId,
        method: req.method,
        path: req.path,
        statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
      });
    });

    next();
  }

  // Error tracking
  trackError(error, req = null) {
    this.metrics.errors.total++;
    this.incrementMetric(this.metrics.errors.byType, error.name || 'Unknown');

    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      request: req ? {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      } : null
    };

    this.metrics.errors.recent.unshift(errorEntry);
    this.metrics.errors.recent = this.metrics.errors.recent.slice(0, 100); // Keep last 100 errors

    this.log('error', error.message, errorEntry);
  }

  // System monitoring
  startSystemMonitoring() {
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      this.metrics.system.memory.push({
        timestamp: Date.now(),
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external
      });

      this.metrics.system.cpu.push({
        timestamp: Date.now(),
        user: cpuUsage.user,
        system: cpuUsage.system
      });

      // Keep only last 1000 entries
      this.metrics.system.memory = this.metrics.system.memory.slice(-1000);
      this.metrics.system.cpu = this.metrics.system.cpu.slice(-1000);

      // Check system health
      this.checkSystemHealth();
    }, 30000); // Every 30 seconds
  }

  checkSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const memoryRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;

    if (memoryRatio > this.config.alertThresholds.memoryUsage) {
      this.log('warn', 'High memory usage detected', {
        memoryRatio,
        threshold: this.config.alertThresholds.memoryUsage,
        memoryUsage
      });
    }

    // Calculate error rate
    const errorRate = this.metrics.requests.total > 0
      ? this.metrics.errors.total / this.metrics.requests.total
      : 0;

    if (errorRate > this.config.alertThresholds.errorRate) {
      this.log('warn', 'High error rate detected', {
        errorRate,
        threshold: this.config.alertThresholds.errorRate,
        totalRequests: this.metrics.requests.total,
        totalErrors: this.metrics.errors.total
      });
    }
  }

  // Alert system
  checkAlerts(level, message, data) {
    if (level === 'error') {
      this.emit('alert', {
        type: 'error',
        severity: 'high',
        message,
        data,
        timestamp: new Date().toISOString()
      });
    } else if (level === 'warn') {
      this.emit('alert', {
        type: 'warning',
        severity: 'medium',
        message,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Metrics export
  setupMetricsExport() {
    setInterval(() => {
      this.exportMetrics();
    }, 60000); // Every minute
  }

  exportMetrics() {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        metrics: {
          ...this.metrics,
          requests: {
            ...this.metrics.requests,
            byEndpoint: Object.fromEntries(this.metrics.requests.byEndpoint),
            byMethod: Object.fromEntries(this.metrics.requests.byMethod),
            byStatus: Object.fromEntries(this.metrics.requests.byStatus)
          },
          errors: {
            ...this.metrics.errors,
            byType: Object.fromEntries(this.metrics.errors.byType)
          },
          users: {
            ...this.metrics.users,
            active: this.metrics.users.active.size
          }
        }
      };

      fs.writeFileSync(this.config.metricsFile, JSON.stringify(exportData, null, 2));
    } catch (error) {
      console.error('Failed to export metrics:', error);
    }
  }

  // Log rotation
  setupLogRotation() {
    setInterval(() => {
      this.rotateLogs();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  rotateLogs() {
    try {
      if (fs.existsSync(this.config.logFile)) {
        const stats = fs.statSync(this.config.logFile);
        const fileSize = stats.size;
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (fileSize > maxSize) {
          const backupFile = `${this.config.logFile}.${Date.now()}`;
          fs.renameSync(this.config.logFile, backupFile);
          this.log('info', 'Log file rotated', { backupFile });
        }
      }
    } catch (error) {
      console.error('Failed to rotate logs:', error);
    }
  }

  // Utility methods
  incrementMetric(map, key) {
    map.set(key, (map.get(key) || 0) + 1);
  }

  updateAverageResponseTime() {
    const times = this.metrics.performance.responseTimes;
    if (times.length > 0) {
      this.metrics.performance.averageResponseTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
    }
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getMetrics() {
    return {
      ...this.metrics,
      requests: {
        ...this.metrics.requests,
        byEndpoint: Object.fromEntries(this.metrics.requests.byEndpoint),
        byMethod: Object.fromEntries(this.metrics.requests.byMethod),
        byStatus: Object.fromEntries(this.metrics.requests.byStatus)
      },
      errors: {
        ...this.metrics.errors,
        byType: Object.fromEntries(this.metrics.errors.byType)
      },
      users: {
        ...this.metrics.users,
        active: this.metrics.users.active.size
      }
    };
  }

  getHealthStatus() {
    const memoryUsage = process.memoryUsage();
    const memoryRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
    const errorRate = this.metrics.requests.total > 0
      ? this.metrics.errors.total / this.metrics.requests.total
      : 0;

    return {
      status: 'healthy',
      uptime: Date.now() - this.metrics.system.uptime,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        ratio: memoryRatio
      },
      requests: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        errorRate
      },
      performance: {
        averageResponseTime: this.metrics.performance.averageResponseTime,
        slowQueries: this.metrics.performance.slowQueries.length
      },
      users: {
        active: this.metrics.users.active.size,
        total: this.metrics.users.total
      }
    };
  }

  // Cleanup old data
  cleanup() {
    const cutoff = Date.now() - (this.config.retention.metrics * 24 * 60 * 60 * 1000);

    this.metrics.performance.responseTimes =
      this.metrics.performance.responseTimes.filter(time => time > cutoff);

    this.metrics.performance.slowQueries =
      this.metrics.performance.slowQueries.filter(query =>
        new Date(query.timestamp).getTime() > cutoff
      );

    this.metrics.errors.recent =
      this.metrics.errors.recent.filter(error =>
        new Date(error.timestamp).getTime() > cutoff
      );
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

// Export middleware for Express
const monitoringMiddleware = (req, res, next) => {
  monitoringService.trackRequest(req, res, next);
};

// Export error handler
const errorHandler = (error, req, res, next) => {
  monitoringService.trackError(error, req);
  next(error);
};

module.exports = {
  monitoringService,
  monitoringMiddleware,
  errorHandler
};