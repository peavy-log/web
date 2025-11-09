import { LogLevel } from '../constants/LogLevel';

export interface AppVersion {
  name: string;
  code?: number;
}

export interface PeavyOptions {
  /**
   * The remote endpoint to push logs to.
   * Should be a full URL.
   */
  endpoint: string;

  /**
   * Minimum log level to process.
   *
   * Default: LogLevel.Info
   */
  logLevel?: LogLevel;

  /**
   * Enable Peavy to also print the log line to console
   *
   * If Peavy is being used directly from within code,
   * then you probably want this enabled in development.
   *
   * Default: false
   */
  printToConsole?: boolean;

  /**
   * Whether to enable library debug mode.
   * This enables logging (to console only) of local Peavy actions
   *
   * Default: false
   */
  debug?: boolean;

  /**
   * How often to flush buffered logs to server (in milliseconds).
   * Logs are cached in-memory and sent once every pushInterval.
   *
   * Note: Logs are also sent immediately when:
   * - Page is hidden/closed
   * - Buffer reaches 1000 entries
   *
   * Default: 30000 (30 seconds)
   */
  pushInterval?: number;

  /**
   * Attach a handler for uncaught exceptions to immediately send logs.
   *
   * Default: true
   */
  attachUncaughtHandler?: boolean;

  /**
   * Set the application version manually to be included in log labels.
   */
  appVersion?: AppVersion | null;
}

export const DEFAULT_OPTIONS: Required<Omit<PeavyOptions, 'endpoint'>> = {
  logLevel: LogLevel.Info,
  printToConsole: false,
  debug: false,
  pushInterval: 30000, // 30 seconds
  attachUncaughtHandler: true,
  appVersion: null,
};
