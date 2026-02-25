# Error Boundaries - Usage Guide

This document explains how to use error boundaries in the MediMindPlus web frontend for robust error handling and improved user experience.

## Overview

Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of crashing the entire application.

## Components

### 1. ErrorBoundary (General Purpose)

The main error boundary component for catching any React errors.

**Usage:**
```tsx
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary name="feature-section">
  <YourComponent />
</ErrorBoundary>
```

**Props:**
- `name` (string): Identifier for the boundary (used in logging)
- `fallback` (ReactNode, optional): Custom fallback UI
- `onError` (function, optional): Custom error handler callback
- `resetKeys` (array, optional): Keys that trigger automatic reset when changed

**Features:**
- Catches all React component errors
- Logs errors with Winston logger
- Reports to Sentry in production
- Provides retry functionality
- Shows stack traces in development

### 2. PageErrorBoundary (Page Level)

Lightweight error boundary for individual pages. Allows the rest of the app to continue functioning even if one page crashes.

**Usage:**
```tsx
import PageErrorBoundary from './components/PageErrorBoundary';

<PageErrorBoundary pageName="Dashboard">
  <DashboardPage />
</PageErrorBoundary>
```

**Props:**
- `pageName` (string, optional): Name of the page (shown in error message)

**Features:**
- Isolated error handling per page
- Navigation options (Go Back, Home, Retry)
- Doesn't crash the entire app

### 3. NetworkErrorBoundary (Network Errors)

Specialized error boundary for network/API errors with offline detection and retry functionality.

**Usage:**
```tsx
import NetworkErrorBoundary from './components/NetworkErrorBoundary';

<NetworkErrorBoundary onRetry={fetchData}>
  <DataComponent />
</NetworkErrorBoundary>
```

**Props:**
- `onRetry` (function, optional): Custom retry handler

**Features:**
- Detects online/offline status
- Automatic retry when connection restored
- Shows connection status indicator
- Only catches network-related errors

### 4. ErrorFallback (Fallback UI)

The default fallback UI component shown when an error is caught.

**Features:**
- User-friendly error message
- Stack trace display (development only)
- Action buttons (Retry, Go Home, Reload)
- Links to Help Center and Support

### 5. LoadingFallback (Loading UI)

Loading component shown while lazy-loaded components are being fetched.

**Usage:**
```tsx
import { Suspense } from 'react';
import LoadingFallback from './components/LoadingFallback';

<Suspense fallback={<LoadingFallback message="Loading dashboard..." />}>
  <LazyLoadedComponent />
</Suspense>
```

**Props:**
- `message` (string, optional): Loading message (default: "Loading...")
- `fullScreen` (boolean, optional): Full screen mode (default: true)

## Hooks

### useErrorHandler

Custom hook for programmatic error handling.

**Usage:**
```tsx
import { useErrorHandler } from './hooks/useErrorHandler';

function MyComponent() {
  const { handleError, resetError, hasError } = useErrorHandler({
    onError: (error) => console.log('Custom handler:', error),
    logContext: { component: 'MyComponent' }
  });

  const onClick = () => {
    try {
      // Some risky operation
      riskyFunction();
    } catch (error) {
      handleError(error); // Will be caught by nearest error boundary
    }
  };

  return <button onClick={onClick}>Click me</button>;
}
```

### useAsyncErrorHandler

Wrapper for async functions with automatic error handling.

**Usage:**
```tsx
import { useAsyncErrorHandler } from './hooks/useErrorHandler';

function MyComponent() {
  const fetchData = async () => {
    const response = await fetch('/api/data');
    return response.json();
  };

  const [wrappedFetch, { loading, error }] = useAsyncErrorHandler(fetchData, {
    logContext: { component: 'MyComponent' }
  });

  return (
    <button onClick={wrappedFetch} disabled={loading}>
      {loading ? 'Loading...' : 'Fetch Data'}
    </button>
  );
}
```

## Implementation

### App-Level Error Boundaries

The app is wrapped with two error boundaries in `App.tsx`:

```tsx
<ErrorBoundary name="app-root">
  <I18nextProvider i18n={i18n}>
    <BrowserRouter basename={__BASE_PATH__}>
      <ErrorBoundary name="router">
        <AppRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  </I18nextProvider>
</ErrorBoundary>
```

This provides two layers of protection:
1. **app-root**: Catches errors in the entire app
2. **router**: Catches errors in routing logic

### Suspense for Lazy Loading

All lazy-loaded routes are wrapped with Suspense in `router/index.ts`:

```tsx
<Suspense fallback={<LoadingFallback message="Loading page..." />}>
  {element}
</Suspense>
```

## Best Practices

### 1. Granular Error Boundaries

Wrap sections that might fail independently:

```tsx
<PageErrorBoundary pageName="Dashboard">
  <ErrorBoundary name="dashboard-charts">
    <Charts />
  </ErrorBoundary>

  <ErrorBoundary name="dashboard-stats">
    <Statistics />
  </ErrorBoundary>
</PageErrorBoundary>
```

### 2. Network Operations

Wrap components that fetch data:

```tsx
<NetworkErrorBoundary onRetry={refetchData}>
  <DataTable />
</NetworkErrorBoundary>
```

### 3. Critical vs Non-Critical

Don't wrap critical UI in error boundaries:

```tsx
// ❌ Don't do this - navigation is critical
<ErrorBoundary name="nav">
  <Header />
  <Navigation />
</ErrorBoundary>

// ✅ Do this - content can fail independently
<Header />
<Navigation />
<ErrorBoundary name="content">
  <PageContent />
</ErrorBoundary>
```

### 4. Custom Fallback UI

Provide context-specific fallback UI:

```tsx
<ErrorBoundary
  name="payment-form"
  fallback={
    <div className="p-8 text-center">
      <h3>Payment Processing Error</h3>
      <p>Please contact support at support@medimind.com</p>
    </div>
  }
>
  <PaymentForm />
</ErrorBoundary>
```

### 5. Reset Keys

Use resetKeys to automatically reset boundaries when dependencies change:

```tsx
<ErrorBoundary name="user-profile" resetKeys={[userId]}>
  <UserProfile userId={userId} />
</ErrorBoundary>
```

When `userId` changes, the error boundary automatically resets.

## Error Logging

All errors are logged using the Winston logger with structured metadata:

```typescript
logger.error('React component error caught by error boundary', {
  service: 'error-boundary',
  boundaryName: 'dashboard',
  error: error.message,
  stack: error.stack,
  componentStack: errorInfo.componentStack,
});
```

### Sentry Integration

In production, errors are automatically reported to Sentry:

```typescript
Sentry.withScope((scope) => {
  scope.setTag('error_boundary', 'dashboard');
  scope.setContext('errorInfo', {
    componentStack: errorInfo.componentStack,
  });
  Sentry.captureException(error);
});
```

## Testing Error Boundaries

### Development Testing

Create a test component that throws an error:

```tsx
function ErrorTest() {
  throw new Error('Test error');
  return null;
}

<ErrorBoundary name="test">
  <ErrorTest />
</ErrorBoundary>
```

### Network Error Testing

Simulate network errors:

```tsx
function NetworkErrorTest() {
  throw new Error('Failed to fetch data');
  return null;
}

<NetworkErrorBoundary>
  <NetworkErrorTest />
</NetworkErrorBoundary>
```

## Troubleshooting

### Error boundaries not catching errors

**Possible causes:**
1. Error thrown in event handler (use try-catch)
2. Error in async code (use useAsyncErrorHandler)
3. Error in error boundary itself

**Solutions:**
```tsx
// ❌ Won't be caught by error boundary
<button onClick={() => { throw new Error('Error'); }}>
  Click
</button>

// ✅ Will be caught
function MyComponent() {
  const { handleError } = useErrorHandler();

  return (
    <button onClick={() => {
      try {
        throw new Error('Error');
      } catch (error) {
        handleError(error);
      }
    }}>
      Click
    </button>
  );
}
```

### Infinite error loops

If an error boundary itself throws an error, wrap it with another boundary:

```tsx
<ErrorBoundary name="outer">
  <ErrorBoundary name="inner">
    <Component />
  </ErrorBoundary>
</ErrorBoundary>
```

## Performance Considerations

- Error boundaries have minimal performance impact
- Only add error boundaries where errors might occur
- Don't wrap every single component
- Use granular boundaries to isolate failures

## Browser Support

Error boundaries work in all modern browsers that support React 16.8+:
- Chrome 67+
- Firefox 60+
- Safari 11.1+
- Edge 79+

## Future Enhancements

Planned improvements:
- [ ] Error recovery strategies
- [ ] Automatic retry with exponential backoff
- [ ] Error rate limiting
- [ ] User feedback collection
- [ ] A/B testing different error messages
