# Peavy Web/TypeScript Library

## Installation

```bash
npm install @peavy-log/web
```

## Usage

```typescript
import { Peavy, LogLevel } from '@peavy-log/web';

// Initialize
Peavy.init({
  endpoint: 'https://my-endpoint.com',
  logLevel: LogLevel.Info,
  printToConsole: true,
});
```

### Logging

```typescript
// Simple logging
Peavy.t('Trace message'); // Trace
Peavy.d('Debug message'); // Debug
Peavy.i('Info message', {
  extra: 'data',
}); // Info
Peavy.w('Warning message'); // Warning
Peavy.e('Error message'); // Error

// Logging with errors
try {
  // some code
} catch (error) {
  Peavy.e('Operation failed', error);
}

// Advanced logging with custom builder
Peavy.log((builder) => {
  builder.level = LogLevel.Warning;
  builder.message = 'Custom log message';
  builder.json = { customField: 'value' };
});
```

### Events

Track user actions and state changes.

State changes are events that represent a persistent configuration or mode of the application changing.
Examples include changing dark mode/theme/colors or enabling/disabling a feature.

```typescript
import { Peavy } from '@peavy-log/web';

// Track a user action
Peavy.action('user', 'login', 1200, EventResult.Success);
Peavy.action('qr', 'open');

// Track state events
Peavy.state('<category>', '<name>', '<value>');
Peavy.state('app', 'persistence', 'indexeddb');
```

### Metadata

Add persistent metadata to all logs. This persists across sessions (using localstorage).

This should be used sparingly, and only for data that is relevant for all logs and events,
and which is not available or inferrable elsewhere.

Versions are automatically managed, so need not be added. The same goes for environment and global app info.

```typescript
// Set metadata
Peavy.setMeta({
  userId: '12345',
});

// Clear metadata
Peavy.clearMeta();
```
