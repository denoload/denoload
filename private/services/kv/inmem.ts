import { Kv, KvEntry } from "@/private/services/kv/kv.ts";

/**
 * provideInMem define a provider for in memory based Kv implementation.
 */
export function provideInMem(): Kv {
  return new InMem();
}

interface KvData {
  data: Record<string, KvData>;
  entry?: KvEntry;
}

class InMem implements Kv {
  private readonly data: KvData = { data: {} };

  // deno-lint-ignore no-explicit-any
  set(key: string[], value: any): Promise<void> {
    let data = this.data;
    for (const k of key) {
      if (data.data[k] === undefined) data.data[k] = { data: {} };

      data = data.data[k];
    }

    data.entry = { key, value };

    return Promise.resolve();
  }
  // deno-lint-ignore no-explicit-any
  get(key: string[]): Promise<any> {
    let data = this.data;
    for (const k of key) {
      if (data.data[k] === undefined) return Promise.resolve(undefined);

      data = data.data[k];
    }

    return Promise.resolve(data.entry?.value);
  }

  list({ prefix }: { prefix: string[] }): Promise<KvEntry[]> {
    let data = this.data;
    for (const k of prefix) {
      if (data.data[k] === undefined) return Promise.resolve([]);

      data = data.data[k];
    }

    return Promise.resolve([...this.listRecursive(data)]);
  }

  private *listRecursive(data: KvData): Iterable<KvEntry> {
    for (const key of Object.values(data.data)) {
      for (const entry of this.listRecursive(key)) {
        yield entry;
      }
    }

    if (data.entry) {
      yield data.entry;
    }
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}
