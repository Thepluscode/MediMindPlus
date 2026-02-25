/**
 * Error Handler Hook
 *
 * Custom hook for programmatic error handling
 * Works with error boundaries to trigger fallback UI
 */

import { useState, useCallback } from 'react';
import logger from '../utils/logger';

interface UseErrorHandlerOptions {
  onError?: (error: Error) => void;
  logContext?: Record<string, any>;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { onError, logContext } = options;
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback(
    (error: Error | string) => {
      const errorObj = typeof error === 'string' ? new Error(error) : error;

      // Log error
      logger.error('Error handled by useErrorHandler', {
        service: 'error-handler-hook',
        error: errorObj.message,
        stack: errorObj.stack,
        ...logContext,
      });

      // Call custom error handler
      if (onError) {
        onError(errorObj);
      }

      // Set error state (will be caught by error boundary)
      setError(errorObj);
    },
    [onError, logContext]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Throw error if set (will be caught by nearest error boundary)
  if (error) {
    throw error;
  }

  return {
    handleError,
    resetError,
    hasError: error !== null,
  };
}

/**
 * Async error handler wrapper
 * Wraps async functions to automatically handle errors
 */
export function useAsyncErrorHandler<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  options: UseErrorHandlerOptions = {}
): [T, { loading: boolean; error: Error | null }] {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { onError, logContext } = options;

  const wrappedFn = useCallback(
    async (...args: Parameters<T>) => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFn(...args);
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));

        // Log error
        logger.error('Async error caught', {
          service: 'async-error-handler',
          error: errorObj.message,
          stack: errorObj.stack,
          ...logContext,
        });

        // Call custom error handler
        if (onError) {
          onError(errorObj);
        }

        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn, onError, logContext]
  ) as T;

  return [wrappedFn, { loading, error }];
}
