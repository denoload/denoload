import { KvConfig } from "@/private/services/kv/config.ts";
import { Kv } from "@/private/services/kv/kv.ts";
import { provideInMem } from "@/private/services/kv/inmem.ts";
import { provideHttp } from "@/private/services/kv/http.ts";
import { Teardown } from "@/private/services/teardown/mod.ts";

export * from "@/private/services/kv/kv.ts";
export * from "@/private/services/kv/config.ts";

/**
 * provideKv define a provider a Kv.
 */
export function provideKv(config: KvConfig, teardown: Teardown): Kv {
  switch (config.impl) {
    case "memory":
      return provideInMem();
    case "http":
      return provideHttp(teardown, config.port);
  }
}
