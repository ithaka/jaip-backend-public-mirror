export interface TimeSeriesDataPoint {
  bucket: string; //Date bucket in YYYY-MM-DD
  n: number; //Number of events in that bucket
}

export type TimePeriod = "days_30" | "weeks_ytd" | "months_ytd" | "years_all";

// Generic structure for all the analytics metrics that use time series
export interface AnalyticsMetric {
  time_period: TimePeriod;
  total: number; //Sum of all events in the time period
  series: TimeSeriesDataPoint[];
}

// Main analytics data structure returned from S3
export interface AnalyticsData {
  group_id: string;
  group_name: string;
  last_exported: string; //ISO timestamp
  student_item_views: AnalyticsMetric[];
  student_searches: AnalyticsMetric[];
}
