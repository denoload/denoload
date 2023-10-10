const realGlobalThis = {};

export function setup() {
  realGlobalThis.fetch = globalThis.fetch;
  globalThis.fetch = function (...args) {
    const start = performance.now();
    const promise = realGlobalThis.fetch(...args);
    promise.finally(() => {
      performance.measure("fetch", {
        start,
        end: performance.now(),
      });
    });

    return promise;
  };
}
