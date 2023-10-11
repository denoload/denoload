import { VERSION } from "./version.ts";

const realGlobalThis = {};

const defaultUserAgent = `denoload/${VERSION}`;
const defaultHeaders = {
  "User-Agent": defaultUserAgent,
};

export function setup() {
  realGlobalThis.fetch = globalThis.fetch;
  globalThis.fetch = function (resource, options) {
    const start = performance.now();

    options = options || { headers: defaultHeaders };
    options.headers = options.headers || defaultHeaders;
    options.headers["User-Agent"] = options.headers["User-Agent"] ||
      defaultUserAgent;

    const promise = realGlobalThis.fetch(resource, options);
    promise.finally(() => {
      performance.measure("fetch", {
        start,
        end: performance.now(),
      });
    });

    return promise;
  };
}
