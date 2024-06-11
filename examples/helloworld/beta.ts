import expect from "expect";
import { type Report } from "@negrel/denoload-metrics";

export const options = {
  threshold: ({ metrics }: { metrics: Report }) => {
    if (Object.keys(metrics.trends.iterations).includes("fail")) {
      throw new Error("an iteration failed");
    }
  },
  scenarios: {
    shared: {
      executor: "shared-iterations",
      iterations: 256,
      vus: 128,
      gracefulStop: "4s",
      // maxDuration: '1s'
    },
    // perVuIter: {
    //   executor: 'per-vu-iterations',
    //   vus: 1,
    //   iterations: 3,
    //   maxDuration: 3000
    // },
    // perVuIter2: {
    //   executor: 'per-vu-iterations',
    //   vus: 1,
    //   iterations: 3
    // }
  },
};

export default async function (): Promise<void> {
  for (let i = 0; i < 5; i++) {
    // const target = `http://httpbin.org/cookies/set/foo_${i}/${i * 2}`;
    const target = "http://localhost:8000";
    const response = await fetch(target);
    expect(response.ok).toBe(true);
    await Bun.sleep(1000);
  }
}
