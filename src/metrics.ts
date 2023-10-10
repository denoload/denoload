export interface PerformanceMetric {
  datapoints: number;
  min: number;
  avg: number;
  max: number;
}

export function aggregateMetrics(
  ...metrics: Record<string, PerformanceMetric>[]
): Record<string, PerformanceMetric> {
  const result: Record<string, PerformanceMetric> = {};

  for (let i = 0; i < metrics.length; i++) {
    const singleMetricsRecord = metrics[i];

    for (const metricName in singleMetricsRecord) {
      const singleMetric = singleMetricsRecord[metricName];
      if (result[metricName] === undefined) {
        result[metricName] = singleMetric;
        continue;
      }
      const resultMetric = result[metricName];

      if (resultMetric.max < singleMetric.max) {
        resultMetric.max = singleMetric.max;
      }
      if (resultMetric.min > singleMetric.min) {
        resultMetric.min = singleMetric.min;
      }
      resultMetric.avg = (resultMetric.avg * resultMetric.datapoints +
        singleMetric.avg * singleMetric.datapoints) /
        (singleMetric.datapoints + resultMetric.datapoints);
      resultMetric.datapoints += singleMetric.datapoints;
    }
  }

  return result;
}
