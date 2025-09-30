import { alert_statuses } from "@prisma/client";

export const valid_get_alerts_query = {
  page: 1,
  limit: 10,
  groups: [1, 2],
};
export const alerts_fixture = {
  text: "This is a test alert",
  status: "info",
};

export const invalid_targeted_alert = {
  text: "This is a test alert",
  status: "invalid_status" as alert_statuses,
};

export const targeted_alert = {
  text: "This is a test alert",
  status: "info" as alert_statuses,
  is_active: true,
  start_date: new Date("2024-01-01T00:00:00.000Z"),
  // Setting the end date to a far future date so we can assume it isn't expired.
  end_date: new Date("2050-12-31T23:59:59.999Z"),
};
export const targeted_alert_with_groups = {
  ...targeted_alert,
  groups: [1, 2],
};

export const targeted_alert_with_facilities = {
  ...targeted_alert,
  facilities: [1, 2],
};

export const full_targeted_alert = {
  id: 1,
  ...targeted_alert,
  entity_id: 1,
  created_at: new Date("2024-01-01T00:00:00.000Z"),
  updated_at: new Date("2024-01-01T00:00:00.000Z"),
};

export const full_targeted_alert_with_facilities = {
  ...full_targeted_alert,
  facilities: [1, 2],
};

export const full_targeted_alert_with_groups = {
  ...full_targeted_alert,
  groups: [1, 2],
};

export const full_targeted_alert_with_string_dates = {
  ...full_targeted_alert,
  start_date: full_targeted_alert.start_date.toISOString(),
  end_date: full_targeted_alert.end_date.toISOString(),
  created_at: full_targeted_alert.created_at.toISOString(),
  updated_at: full_targeted_alert.updated_at.toISOString(),
};
export const full_targeted_alert_with_facilities_and_string_dates = {
  ...full_targeted_alert_with_facilities,
  start_date: full_targeted_alert.start_date.toISOString(),
  end_date: full_targeted_alert.end_date.toISOString(),
  created_at: full_targeted_alert.created_at.toISOString(),
  updated_at: full_targeted_alert.updated_at.toISOString(),
};

export const targeted_alert_expired = {
  id: 1,
  text: "This is a test alert",
  status: "info" as alert_statuses,
  is_active: true,
  start_date: new Date("2024-01-01T00:00:00.000Z"),
  end_date: new Date("2024-12-31T23:59:59.999Z"),
};

export const targeted_alert_upcoming = {
  id: 1,
  text: "This is a test alert",
  status: "info" as alert_statuses,
  is_active: true,
  // Setting the start date to a far future date so we can assume it will be upcoming.
  start_date: new Date("2040-01-01T00:00:00.000Z"),
  // Setting the end date to a far future date so we can assume it isn't expired.
  end_date: new Date("2050-12-31T23:59:59.999Z"),
};

export const targeted_alerts = [
  {
    ...targeted_alert,
    id: 1,
  },
  {
    ...targeted_alert,
    id: 2,
  },
];

export const all_targeted_alerts = [
  targeted_alert,
  targeted_alert_expired,
  targeted_alert_upcoming,
];
