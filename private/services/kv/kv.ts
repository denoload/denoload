// deno-lint-ignore-file no-explicit-any

/**
 * Kv define a key-value store interface.
 */
export interface Kv {
  set(key: string[], value: any): Promise<void>;
  get(key: string[]): Promise<any>;
  list(_: { prefix: string[] }): Promise<KvEntry[]>;
  close(): Promise<void>;
}

/**
 * KvEntry define an entry in a key-value store.
 */
export interface KvEntry {
  key: string[];
  value: any;
}

/**
 * encodeKey encodes a key as a single string value.
 */
export function encodeKey(key: string[]): string {
  return key.map((k) => encodeURI(k)).join(" ");
}

/**
 * decodeKey decodes a key previously encoded using {@link encodeKey}.
 */
export function decodeKey(key: string): string[] {
  return key.split(" ")
    .map((k) => decodeURI(k));
}
