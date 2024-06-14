import { encodeKey, Kv, KvEntry } from "@/private/services/kv/kv.ts";
import { decodeKey } from "@/private/services/kv/mod.ts";
import { provideInMem } from "@/private/services/kv/inmem.ts";
import { Teardown } from "@/private/services/teardown/mod.ts";

/**
 * provideLocalhost provides an HTTP based Kv implementation.
 */
export function provideHttp(teardown: Teardown, port?: number): Kv {
  port = server(teardown, port);

  return new Http(port);
}

/**
 * Http is an HTTP based Kv implementation.
 */
class Http implements Kv {
  private readonly serverUrl: string;

  constructor(port: number) {
    this.serverUrl = `http://localhost:${port}`;
  }

  // deno-lint-ignore no-explicit-any
  async set(key: string[], value: any): Promise<void> {
    const resp = await fetch(
      this.serverUrl + "/data/" + encodeURI(encodeKey(key)),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(value),
      },
    );
    if (!resp.ok) {
      throw new Error(
        `HttpKv get failed: fetch failed: ${resp.status} ${resp.statusText}: ${await resp
          .text()}`,
      );
    }

    resp.body?.cancel();
  }

  // deno-lint-ignore no-explicit-any
  async get(key: string[]): Promise<any> {
    const resp = await fetch(
      this.serverUrl + "/data/" + encodeURI(encodeKey(key)),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (!resp.ok) {
      throw new Error(
        `HttpKv get failed: fetch failed: ${resp.status} ${resp.statusText}: ${await resp
          .text()}`,
      );
    }
    if (resp.headers.get("Content-Length") === "0") {
      // Read response body to prevent leak.
      await resp.body?.cancel();
      return undefined;
    }

    return resp.json();
  }

  async list({ prefix }: { prefix: string[] }): Promise<KvEntry[]> {
    const resp = await fetch(
      this.serverUrl + "/list/" + encodeURI(encodeKey(prefix)),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (!resp.ok) {
      throw new Error(
        `HttpKv get failed: fetch failed: ${resp.status} ${resp.statusText}: ${await resp
          .text()}`,
      );
    }
    if (resp.headers.get("Content-Length") === "0") {
      // Read response body to prevent leak.
      await resp.body?.cancel();
      return [];
    }

    const entries = await resp.json() as KvEntry[];

    return entries;
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}

function server(teardown: Teardown, port?: number): number {
  const kv = provideInMem();

  const server = Deno.serve({
    onListen: () => {},
    port: port ?? 0,
  }, async (req: Request) => {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/data/")) {
      const key = decodeKey(decodeURI(url.pathname.slice("/data/".length)));

      switch (req.method) {
        case "POST": {
          const value = await req.json();
          await kv.set(key, value);
          return new Response();
        }

        case "GET": {
          const value = await kv.get(key);
          if (value === undefined) return new Response();
          return Response.json(value);
        }

        default:
          return Response.error();
      }
    } else if (url.pathname.startsWith("/list/")) {
      const prefix = decodeKey(decodeURI(url.pathname.slice("/list/".length)));
      const entries = await kv.list({ prefix });

      return Response.json(entries);
    } else {
      return Response.error();
    }
  });

  teardown.registerTeardownProcedure(server.shutdown);

  return server.addr.port;
}
