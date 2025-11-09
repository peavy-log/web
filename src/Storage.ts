import { LogEntry } from './LogEntry';
import { Debug } from './Debug';

export class Storage {
  private buffer: LogEntry[] = [];

  storeEntry(entry: LogEntry): void {
    this.buffer.push(entry);
    Debug.log(`Stored entry to buffer (${this.buffer.length} entries)`);
  }

  flush(): LogEntry[] {
    const entries = [...this.buffer];
    this.buffer = [];
    return entries;
  }
}
