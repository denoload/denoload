import { assertEquals } from "std/assert/assert_equals.ts";
import { aggregateMetrics, PerformanceMetric } from "./metrics.ts";

Deno.test("aggregate metrics are correct", () => {
  const recordA: Record<string, PerformanceMetric> = {
    fetch: {
      datapoints: 1,
      min: 2,
      avg: 2,
      max: 2,
    },
  };
  const recordB: Record<string, PerformanceMetric> = {
    fetch: {
      datapoints: 7,
      min: 1,
      avg: 6,
      max: 8,
    },
  };

  const result = aggregateMetrics(recordA, recordB);

  assertEquals(result, {
    fetch: {
      datapoints: 8,
      min: 1,
      avg: 5.5,
      max: 8,
    },
  });
});
