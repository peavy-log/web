import { PeavyOptions } from "./options/PeavyOptions";
import { Storage } from "./Storage";
import { LogEntry, logEntryToJson } from "./LogEntry";
import { Debug } from "./Debug";

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

    window.addEventListener("pagehide", () => {
      this.prepareAndPush(true);
    });
  }

  prepareAndPush(beacon?: boolean): void {
    const entries = this.storage.flush();
    this.pushEntries(entries, beacon);
  }

  private async pushEntries(
    entries: LogEntry[],
    beacon?: boolean
  ): Promise<void> {
    if (entries.length === 0) return;

    // Convert entries to NDJSON format
    const ndjson = entries
      .map((entry) => JSON.stringify(logEntryToJson(entry)))
      .join("\n");

    Debug.log(`Pushing ${entries.length} entries (${ndjson.length} bytes)`);

    const compressed = await this.compressData(ndjson);
    Debug.log(
      `Compressed to ${compressed.size} bytes (${(
        (compressed.size / ndjson.length) *
        100
      ).toFixed(1)}% of original)`
    );

    try {
      if (beacon && navigator.sendBeacon) {
        const endpoint = this.options.endpoint + "?gzip=true";
        navigator.sendBeacon(endpoint, compressed);
      } else {
        const response = await fetch(this.options.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/ndjson",
            "Content-Encoding": "gzip",
          },
          body: compressed,
          keepalive: true,
        });
        if (response.ok) {
          Debug.log(`Successfully sent ${entries.length} entries`);
        } else {
          Debug.log(`Push failed`);
        }
      }
    } catch (error) {
      Debug.warnSome("Error pushing", error as Error);
    }
  }

  private async compressData(data: string): Promise<Blob> {
    try {
      const stream = new Blob([data], { type: "application/ndjson" }).stream();
      const compressedStream = stream.pipeThrough(
        new CompressionStream("gzip")
      );
      return new Response(compressedStream).blob();
    } catch (error) {
      Debug.warnSome("Error compressing data", error as Error);
      return new Blob([data], { type: "application/ndjson" });
    }
  }
}
