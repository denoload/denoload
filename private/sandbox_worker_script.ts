import { workerMessageHandler } from "@negrel/rpc";

declare const self: Worker;

self.onmessage = workerMessageHandler(
  {
    async runUntrustedCode(
      { moduleUrl, fnName, args }: {
        moduleUrl: string;
        fnName: string;
        args: unknown;
      },
    ) {
      const module = await import(moduleUrl);
      return await module[fnName](args);
    },
    async listModuleExports({ moduleUrl }: { moduleUrl: string }) {
      const module = await import(moduleUrl);
      return JSON.parse(
        JSON.stringify(module, (_key, value) => {
          if (typeof value === "function") return value.toString();

          return value;
        }),
      );
    },
  },
);
