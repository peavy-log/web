import { EventState } from './constants/EventState';
import { Debug } from './Debug';
import { Device } from './Device';
import type { Peavy } from './Peavy';

export class EventStateReporter {
  constructor(private peavy: Peavy) {}

  sendState(): void {
    this.attempt(() => this.reportAppVersion());
    this.attempt(() => this.reportDeviceLanguage());
    this.attempt(() => this.reportDeviceScreen());
    this.attempt(() => this.reportUiTheme());
    this.attempt(() => this.reportNetworkType());
    this.attempt(() => this.reportNotifications());
    this.attempt(() => this.reportAvailableMemory());
    this.attempt(() => {
      const browser = Device.detectBrowser();
      if (browser) {
        this.peavy.state(EventState.DeviceModel, browser.brand);
        this.peavy.state(EventState.PlatformVersion, browser.osVersion ?? `${browser.brand} ${browser.version}`);
      }
    });
  }

  private attempt(fn: () => void): void {
    try {
      fn();
    } catch (e) {
      Debug.warnSome('Failed to collect state', e as Error);
    }
  }

  private reportAppVersion(): void {
    // Web apps don't have a native version, but could use meta tags or config
    const appVersion = Device.getAppVersion(this.peavy['logger'].options);
    if (appVersion) {
      this.peavy.state(EventState.AppVersion, appVersion.name);
      this.peavy.state(EventState.AppVersionCode, appVersion.code);
    }
  }

  private reportDeviceLanguage(): void {
    if (navigator.language) {
      this.peavy.state(EventState.DeviceLanguage, navigator.language);
    }
  }

  private reportDeviceScreen(): void {
    this.peavy.state(EventState.DeviceScreenWidth, window.screen.width);
    this.peavy.state(EventState.DeviceScreenHeight, window.screen.height);
  }

  private reportUiTheme(): void {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.peavy.state(EventState.UiTheme, isDark ? 'dark' : 'light');
  }

  private reportNetworkType(): void {
    // @ts-ignore - NetworkInformation API is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      const type = connection.type;
      if (type && type !== 'cellular' && type !== 'unknown') {
        this.peavy.state(EventState.NetworkType, type);
      } else {
        const effectiveType = connection.effectiveType;
        if (effectiveType) {
          this.peavy.state(EventState.NetworkType, effectiveType);
        }
      }
    }
  }

  private reportNotifications(): void {
    if ('Notification' in window) {
      const permission = Notification.permission;
      this.peavy.state(EventState.Notifications, permission);
    } else {
      this.peavy.state(EventState.Notifications, 'unavailable');
    }
  }

  private reportAvailableMemory(): void {
    // @ts-ignore - deviceMemory is experimental
    const memory = navigator.deviceMemory;
    if (memory !== undefined) {
      // deviceMemory is in GB, should be bytes
      this.peavy.state(EventState.AvailableMemory, memory * 1024 * 1024 * 1024);
    }
  }
}
