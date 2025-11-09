import { Debug } from "./Debug";
import { AppVersion, PeavyOptions } from "./options/PeavyOptions";

export interface Browser {
  brand: string;
  version: string;
  os: string;
  osVersion?: string;
}

export class Device {
  static getAppVersion(options: PeavyOptions): AppVersion | null {
    const metaVersion = document.querySelector('meta[name="version"]');
    const metaVersionCode = document.querySelector('meta[name="version-code"]');
    if (metaVersion) {
      return {
        name: metaVersion.getAttribute('content') || 'unknown',
        code: parseInt(metaVersionCode?.getAttribute('content') || '0', 10),
      };
    }
    return options.appVersion ?? null;
  }

  static async detectBrowser(): Promise<Browser | null> {
    let os = 'Unknown';
    let osVersion: string | undefined;

    // Using User-Agent Client Hints if available
    if ('userAgentData' in navigator) {
      try {
        const uaData = (navigator as any).userAgentData;
        const brands = uaData.brands || [];

        os = uaData.platform;
        if (os === 'iOS' || os === 'Android') {
          os = 'web'; // Normalize to web to avoid confusion with native
        }
        
        // Find the primary browser (not "Chromium" or "Not_A Brand")
        const primaryBrand = brands.find((brand: any) => 
          !brand.brand.includes('Chromium') && 
          !brand.brand.includes('Not') &&
          brand.brand !== 'Microsoft Edge' // Edge reports both Edge and Chromium
        ) || brands[0];
        
        if (primaryBrand) {
          return {
            brand: primaryBrand.brand,
            version: primaryBrand.version,
            os,
            osVersion
          };
        }
      } catch (error) {
        Debug.log('Failed to get userAgentData, falling back to agent parsing');
      }
    }

    // Fallback to UA parsing for OS
    const osInfo = this.detectOSFromUA();
    if (osInfo) {
      os = osInfo.platform;
      if (os === 'iOS' || os === 'Android') {
        os = 'web'; // Normalize to web to avoid confusion with native
      }
      osVersion = osInfo.version;
    }

    const browser = this.detectBrowserFromUA();
    if (browser) {
      return {
        ...browser,
        os,
        osVersion
      };
    }
    
    return null;
  }

  private static detectOSFromUA(): { platform: string; version?: string } | null {
    const ua = navigator.userAgent;
    
    // Windows
    if (ua.includes('Windows NT 10.0')) {
      return { platform: 'windows', version: '10' };
    }
    if (ua.includes('Windows NT 6.3')) {
      return { platform: 'windows', version: '8.1' };
    }
    if (ua.includes('Windows NT 6.2')) {
      return { platform: 'windows', version: '8' };
    }
    if (ua.includes('Windows NT 6.1')) {
      return { platform: 'windows', version: '7' };
    }
    if (ua.includes('Windows')) {
      return { platform: 'windows' };
    }
    
    // macOS
    const macMatch = ua.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
    if (macMatch) {
      return { platform: 'macos', version: macMatch[1].replace(/_/g, '.') };
    }
    if (ua.includes('Mac OS X')) {
      return { platform: 'macos' };
    }
    
    // iOS
    const iosMatch = ua.match(/OS (\d+_\d+(_\d+)?)/);
    if (iosMatch && (ua.includes('iPhone') || ua.includes('iPad'))) {
      return { platform: 'ios', version: iosMatch[1].replace(/_/g, '.') };
    }
    if (ua.includes('iPhone') || ua.includes('iPad')) {
      return { platform: 'ios' };
    }
    
    // Android
    const androidMatch = ua.match(/Android (\d+(\.\d+)?)/);
    if (androidMatch) {
      return { platform: 'Android', version: androidMatch[1] };
    }
    
    // Linux
    if (ua.includes('Linux')) {
      return { platform: 'Linux' };
    }
    
    // Chrome OS
    if (ua.includes('CrOS')) {
      return { platform: 'Chrome OS' };
    }

    return null;
  }

  static detectBrowserFromUA(): Browser | null {
    const ua = navigator.userAgent;
    
    // Get OS info first
    const osInfo = this.detectOSFromUA();
    const os = osInfo?.platform || 'Unknown';
    const osVersion = osInfo?.version;
    
    // Chrome/Chromium
    const chromeMatch = ua.match(/Chrome\/(\d+)/);
    if (chromeMatch && !ua.includes('Edg')) {
      return { brand: 'Chrome', version: chromeMatch[1], os, osVersion };
    }
    
    // Edge
    const edgeMatch = ua.match(/Edg\/(\d+)/);
    if (edgeMatch) {
      return { brand: 'Edge', version: edgeMatch[1], os, osVersion };
    }
    
    // Firefox
    const firefoxMatch = ua.match(/Firefox\/(\d+)/);
    if (firefoxMatch) {
      return { brand: 'Firefox', version: firefoxMatch[1], os, osVersion };
    }
    
    // Safari
    const safariMatch = ua.match(/Version\/(\d+).*Safari/);
    if (safariMatch && !ua.includes('Chrome')) {
      return { brand: 'Safari', version: safariMatch[1], os, osVersion };
    }
    
    // Opera
    const operaMatch = ua.match(/OPR\/(\d+)/);
    if (operaMatch) {
      return { brand: 'Opera', version: operaMatch[1], os, osVersion };
    }

    return null;
  }
}