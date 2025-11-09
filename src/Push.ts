import { PeavyOptions } from './options/PeavyOptions';
import { Storage } from './Storage';
import { LogEntry, logEntryToJson } from './LogEntry';
import { Debug } from './Debug';

export class Push {
  private pushTimer: number | null = null;

  constructor(public options: PeavyOptions, private storage: Storage) {
    this.flushPeriodically();
  }

  private flushPeriodically(): void {
    const interval = this.options.pushInterval || 30000;
    this.pushTimer = window.setInterval(() => {
      this.prepareAndPush();
    }, interval);

    window.addEventListener('beforeunload', () => {
      this.prepareAndPush(true);
    });
  }

  async prepareAndPush(beacon?: boolean): Promise<void> {
    const entries = this.storage.flush();
    this.pushEntries(entries, beacon);
  }

  private async pushEntries(entries: LogEntry[], beacon?: boolean): Promise<void> {
    if (entries.length === 0) return;

    // Convert entries to NDJSON format
    const ndjson = entries
      .map((entry) => JSON.stringify(logEntryToJson(entry)))
      .join('\n');

    Debug.log(`Pushing ${entries.length} entries (${ndjson.length} bytes)`);

    try {
      let success: boolean = false;
      if (beacon && navigator.sendBeacon) {
        const blob = new Blob([ndjson], { type: 'application/ndjson' });
        success = navigator.sendBeacon(this.options.endpoint, blob);
      } else {
        const compressed = await this.compressData(ndjson);
        Debug.log(`Compressed to ${compressed.size} bytes (${((compressed.size / ndjson.length) * 100).toFixed(1)}% of original)`);

        const response = await fetch(this.options.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/ndjson',
            'Content-Encoding': 'gzip',
          },
          body: compressed,
          keepalive: true,
        });
        success = response.ok;
      }

      if (success) {
        Debug.log(`Successfully sent ${entries.length} entries`);
      } else {
        Debug.warn(`Push failed`);
      }
    } catch (error) {
      Debug.warn('Error using Beacon API', error as Error);
    }
  }

  async pushEntry(entry: LogEntry): Promise<void> {
    await this.pushEntries([entry]);
  }

  private async compressData(data: string): Promise<Blob> {
    try {
    const stream = new Blob([data], { type: 'application/ndjson' }).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      return new Response(compressedStream).blob();
    } catch (error) {
      Debug.warn('Error compressing data', error as Error);
      return new Blob([data], { type: 'application/ndjson' });
    }
  }

  destroy(): void {
    if (this.pushTimer) {
      clearInterval(this.pushTimer);
      this.pushTimer = null;
    }
    this.prepareAndPush();
  }
}
