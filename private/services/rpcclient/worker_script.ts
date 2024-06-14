import { workerMessageHandler } from "@negrel/rpc";

declare const self: Worker;

self.onmessage = workerMessageHandler({});
