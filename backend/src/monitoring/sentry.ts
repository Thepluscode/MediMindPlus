import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { Express, Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Initialize Sentry error tracking and performance monitoring
 */
export const initializeSentry = (app: Express) => {
  // Only initialize Sentry if DSN is provided
  if (!process.env.SENTRY_DSN) {
    logger.warn('Sentry DSN not provided - Error tracking disabled', {
      service: 'sentry'
    });
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Integrations
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),

      // Enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),

      // Enable PostgreSQL tracing
      new Tracing.Integrations.Postgres(),
    ],

    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'), // 10% of transactions

    // Release tracking
    release: process.env.APP_VERSION || 'development',

    // Additional options
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && process.env.SENTRY_ENABLE_DEV !== 'true') {
        return null;
      }

      // Filter out sensitive data
      if (event.request) {
        // Remove authorization headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }

        // Remove sensitive query parameters
        if (event.request.query_string) {
          event.request.query_string = event.request.query_string
            .replace(/token=[^&]*/gi, 'token=[REDACTED]')
            .replace(/password=[^&]*/gi, 'password=[REDACTED]')
            .replace(/api_key=[^&]*/gi, 'api_key=[REDACTED]');
        }
      }

      // Add custom tags
      if (event.tags) {
        event.tags.feature = identifyFeatureFromError(hint.originalException);
      }

      return event;
    },

    // Breadcrumbs for better debugging
    beforeBreadcrumb(breadcrumb, hint) {
      // Don't track breadcrumbs for health checks
      if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('/health')) {
        return null;
      }
      return breadcrumb;
    },
  });

  logger.info('Sentry initialized successfully', {
    service: 'sentry',
    environment: process.env.NODE_ENV,
    traceSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'
  });
};

/**
 * Identify which revolutionary feature caused an error
 */
const identifyFeatureFromError = (error: any): string => {
  if (!error) return 'unknown';

  const errorString = error.toString().toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  if (errorString.includes('health twin') || stack.includes('healthtwin')) {
    return 'virtual_health_twin';
  } else if (errorString.includes('mental health') || stack.includes('mentalhealth')) {
    return 'mental_health_crisis';
  } else if (errorString.includes('omics') || stack.includes('omics')) {
    return 'multi_omics';
  } else if (errorString.includes('longevity') || stack.includes('longevity')) {
    return 'longevity_optimization';
  } else if (errorString.includes('employer') || stack.includes('employer')) {
    return 'employer_dashboard';
  } else if (errorString.includes('provider') || stack.includes('provider')) {
    return 'provider_performance';
  } else if (errorString.includes('federated') || stack.includes('federated')) {
    return 'federated_learning';
  } else if (errorString.includes('insurance') || stack.includes('insurance')) {
    return 'predictive_insurance';
  } else if (errorString.includes('drug') || stack.includes('drug')) {
    return 'drug_discovery';
  } else if (errorString.includes('pandemic') || stack.includes('pandemic')) {
    return 'pandemic_warning';
  } else if (errorString.includes('education') || errorString.includes('course') || stack.includes('education')) {
    return 'health_educator';
  } else if (errorString.includes('marketplace') || errorString.includes('data listing') || stack.includes('marketplace')) {
    return 'data_marketplace';
  }

  return 'core_system';
};

/**
 * Request handler middleware - must be the first middleware
 */
export const sentryRequestHandler = () => {
  if (!process.env.SENTRY_DSN) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email', 'role'],
    ip: true,
    request: true,
  });
};

/**
 * Tracing handler middleware - should be after request handler
 */
export const sentryTracingHandler = () => {
  if (!process.env.SENTRY_DSN) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  return Sentry.Handlers.tracingHandler();
};

/**
 * Error handler middleware - must be before other error handlers
 */
export const sentryErrorHandler = () => {
  if (!process.env.SENTRY_DSN) {
    return (err: any, req: Request, res: Response, next: NextFunction) => next(err);
  }
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      // Also capture 404s for important routes (revolutionary features)
      return true;
    },
  });
};

/**
 * Custom error tracking for revolutionary features
 */
export const captureFeatureError = (
  error: Error,
  featureName: string,
  context?: Record<string, any>
) => {
  Sentry.withScope((scope) => {
    scope.setTag('feature', featureName);
    scope.setContext('feature_context', context || {});

    // Set severity based on feature criticality
    const criticalFeatures = ['mental_health_crisis', 'pandemic_warning'];
    if (criticalFeatures.includes(featureName)) {
      scope.setLevel('error');
    } else {
      scope.setLevel('warning');
    }

    Sentry.captureException(error);
  });
};

/**
 * Track custom events (non-errors)
 */
export const captureFeatureEvent = (
  eventName: string,
  data?: Record<string, any>
) => {
  Sentry.captureMessage(eventName, {
    level: 'info',
    contexts: {
      event_data: data || {},
    },
  });
};

/**
 * Set user context for better error tracking
 */
export const setUserContext = (userId: string, email?: string, role?: string) => {
  Sentry.setUser({
    id: userId,
    email: email,
    role: role,
  });
};

/**
 * Clear user context (e.g., on logout)
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for tracking user actions
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Start a transaction for performance monitoring
 */
export const startTransaction = (
  name: string,
  operation: string,
  data?: Record<string, any>
) => {
  return Sentry.startTransaction({
    name,
    op: operation,
    data,
  });
};

/**
 * Middleware to track feature usage with Sentry
 */
export const trackFeatureUsage = (featureName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add breadcrumb for feature usage
    addBreadcrumb(
      `Feature used: ${featureName}`,
      'feature_usage',
      'info',
      {
        user_id: (req as any).user?.id,
        path: req.path,
        method: req.method,
      }
    );

    // Start transaction for performance monitoring
    const transaction = startTransaction(
      `feature.${featureName}`,
      'feature.request',
      {
        feature: featureName,
        user_id: (req as any).user?.id,
      }
    );

    // Attach transaction to request for later use
    (req as any).sentryTransaction = transaction;

    // Finish transaction when response is sent
    res.on('finish', () => {
      transaction.setHttpStatus(res.statusCode);
      transaction.finish();
    });

    next();
  };
};

/**
 * Middleware to set user context from JWT
 */
export const setSentryUserFromAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (user) {
    setUserContext(user.id, user.email, user.role);
  }

  next();
};

/**
 * Capture performance metrics for revolutionary features
 */
export const captureFeaturePerformance = (
  featureName: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  Sentry.withScope((scope) => {
    scope.setTag('feature', featureName);
    scope.setContext('performance', {
      duration_ms: duration,
      ...metadata,
    });

    // Warn if feature is slow
    if (duration > 3000) {
      Sentry.captureMessage(`Slow feature execution: ${featureName}`, {
        level: 'warning',
      });
    }
  });
};

/**
 * Health check for Sentry integration
 */
export const checkSentryHealth = (): boolean => {
  try {
    return Sentry.getCurrentHub().getClient() !== undefined;
  } catch (error) {
    return false;
  }
};

export default {
  initializeSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureFeatureError,
  captureFeatureEvent,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  startTransaction,
  trackFeatureUsage,
  setSentryUserFromAuth,
  captureFeaturePerformance,
  checkSentryHealth,
};
