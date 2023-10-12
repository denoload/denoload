import { PerformanceMetric } from "./metrics.ts";

const CLICKHOUSE_HOST = Deno.env.get("CLICKHOUSE_HOST");
const CLICKHOUSE_USER = Deno.env.get("CLICKHOUSE_USER");
const CLICKHOUSE_PASSWORD = Deno.env.get("CLICKHOUSE_PASSWORD");

const fetchStatsUrl = new URL(
  `http://${CLICKHOUSE_USER}:${CLICKHOUSE_PASSWORD}@${CLICKHOUSE_HOST}:8123/`,
);
fetchStatsUrl.searchParams.set(
  "query",
  "SELECT name, avg(p99) AS p99, avg(p95) AS p95, avg(p90) AS p90, avg(p75) AS p75, avg(p50) AS p50, minMerge(min) AS min, maxMerge(max) AS max, avgMerge(avg) AS avg, sumMerge(count) AS count FROM denoload.stats GROUP BY name;",
);
fetchStatsUrl.searchParams.set("default_format", "JSON");

export async function fetchStats(): Promise<Record<string, PerformanceMetric>> {
  const response = await fetch(fetchStatsUrl, {});
  const body = await response.json();

  const result: Record<string, PerformanceMetric> = {};
  for (const metric of body.data) {
    result[metric.name] = metric;
  }

  return result;
}
