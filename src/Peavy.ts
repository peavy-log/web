import { PeavyOptions, DEFAULT_OPTIONS } from "./options/PeavyOptions";
import { Logger } from "./Logger";
import { Storage } from "./Storage";
import { Push } from "./Push";
import { LogLevel } from "./constants/LogLevel";
import { LogEntryBuilder } from "./LogEntry";
import { Debug } from "./Debug";
import { EventType } from "./constants/EventType";
import { EventResult } from "./constants/EventResult";
import { EventStateReporter } from "./EventStateReporter";
import { attachListeners } from "./integrations/interactions";

class PeavyInstance {
  private logger!: Logger;
  private push!: Push;
  private stateReporter!: EventStateReporter;
  private meta: Record<string, any> = {};

  isInitialized: boolean = false;

  init(options: PeavyOptions): void {
    const fullOptions: PeavyOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    Debug.enabled = !!fullOptions.debug;

    const storage = new Storage();
    this.logger = new Logger(fullOptions, storage);
    this.push = new Push(fullOptions, storage);
    this.stateReporter = new EventStateReporter(this);

    Debug.setDependencies(this.logger, this.push);

    if (fullOptions.attachUncaughtHandler) {
      this.attachUncaughtHandler();
    }
    if (fullOptions.attachInteractionListeners) {
      attachListeners();
    }

    this.restoreMeta();
    this.isInitialized = true;

    this.stateReporter.sendState();
  }

  setOptions(options: Partial<PeavyOptions>): void {
    if (options.endpoint !== undefined) {
      this.push.options.endpoint = options.endpoint;
    }
    if (options.logLevel !== undefined) {
      this.logger.options.logLevel = options.logLevel;
    }
    if (options.pushInterval !== undefined) {
      this.push.options.pushInterval = options.pushInterval;
    }
  }

  clearMeta(): void {
    this.logger.meta = {};
    this.meta = {};
    localStorage.removeItem("__peavy_meta");
  }

  setMeta(metas: Record<string, any>): void {
    for (const [key, value] of Object.entries(metas)) {
      if (value === null || value === undefined) {
        delete this.logger.meta[key];
        delete this.meta[key];
      } else {
        this.logger.meta[key] = value;
        this.meta[key] = value;
      }
    }
    this.saveMeta();
  }

  private saveMeta(): void {
    try {
      localStorage.setItem("__peavy_meta", JSON.stringify(this.meta));
    } catch (error) {
      Debug.warn("Failed to save meta to localStorage", error as Error);
    }
  }

  private restoreMeta(): void {
    try {
      const saved = localStorage.getItem("__peavy_meta");
      if (saved) {
        this.meta = JSON.parse(saved);
        Object.assign(this.logger.meta, this.meta);
      }
    } catch (error) {
      Debug.warn("Failed to restore meta from localStorage", error as Error);
    }
  }

  private attachUncaughtHandler(): void {
    window.addEventListener("error", (event) => {
      this.e("Uncaught exception", event.error);
      this.push.prepareAndPush();
    }, { passive: true });

    window.addEventListener("unhandledrejection", (event) => {
      this.e("Unhandled promise rejection", event.reason);
      this.push.prepareAndPush();
    }, { passive: true });
  }

  log(builder: LogEntryBuilder | ((b: LogEntryBuilder) => void)): void {
    this.logger.log(builder);
  }

  t(message: string, error?: Error | unknown): void {
    this.logger.log({
      level: LogLevel.Trace,
      message,
      error,
    });
  }

  d(message: string, error?: Error | unknown): void {
    this.logger.log({
      level: LogLevel.Debug,
      message,
      error,
    });
  }

  i(message: string, error?: Error | unknown): void {
    this.logger.log({
      level: LogLevel.Info,
      message,
      error,
    });
  }

  w(message: string, error?: Error | unknown): void {
    this.logger.log({
      level: LogLevel.Warning,
      message,
      error,
    });
  }

  e(message: string, error?: Error | unknown): void {
    this.logger.log({
      level: LogLevel.Error,
      message,
      error,
    });
  }

  ev(
    type: EventType,
    category: string,
    name: string,
    ident: string | number | boolean = "",
    durationMs: number = 0,
    result: EventResult = EventResult.Success
  ): void {
    this.logger.log({
      level: LogLevel.Info,
      json: {
        __peavy_type: "event",
        message: "", // empty out the default message
        type,
        category,
        name,
        ident: String(ident),
        duration: durationMs,
        result,
      },
    });
  }

  action(category: string, name: string): void;
  action(
    category: string,
    name: string,
    ident: string | number | boolean
  ): void;
  action(category: string, name: string, result: EventResult): void;
  action(
    category: string,
    name: string,
    durationMs: number,
    result: EventResult
  ): void;
  action(
    category: string,
    name: string,
    identDurationResult: string | number | boolean | EventResult = "",
    result: EventResult | undefined = undefined
  ): void {
    let ident: string | number | boolean = "";
    let durationMs: number = 0;
    if (result) {
      durationMs =
        typeof identDurationResult === "number" ? identDurationResult : 0;
    } else if (identDurationResult) {
      if (
        typeof identDurationResult === "string" &&
        [
          EventResult.Success,
          EventResult.Failure,
          EventResult.Timeout,
          EventResult.Cancelled,
        ].includes(identDurationResult as EventResult)
      ) {
        result = identDurationResult as EventResult;
      } else {
        ident = identDurationResult;
      }
    }

    this.ev(EventType.Action, category, name, ident, durationMs, result);
  }

  state(name: string, ident: string | number | boolean = ""): void {
    this.ev(EventType.State, "device", name, ident);
  }
}

export const Peavy = new PeavyInstance();
export type Peavy = PeavyInstance;
