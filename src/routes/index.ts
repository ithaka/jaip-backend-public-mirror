// Import individual routes
import auth from "./auth/routes";
import subdomains from "./subdomains/routes";
import disciplines from "./disciplines/routes";
import healthcheck from "./healthchecks/routes";
import alerts from "./alerts/routes";
import media_review from "./media_review/routes";
import search from "./search/routes";
import pages from "./pages/routes";
import account_management from "./account_management/routes";
import site_administration from "./site_administration";
import environment from "./environment/routes";
import logging from "./logging/routes";
import global_restricted_list from "./global_restricted_list/routes";
import search_v3 from "./search_v3/routes";
import alerts_v3 from "./alerts_v3/routes";

// import downloads from "./downloads/routes";

// Some of these routes are grouped, so we need to flatten the array
// to avoid nested arrays in the final export. While the realistic depth
// of the array won't likely exceed 3, we use 10 to be safe. Infinity seems like
// overkill and could lead to performance issues. It's not a huge concern as it
// is a one-time operation at startup.
export default [
  auth,
  healthcheck,
  subdomains,
  disciplines,
  alerts,
  media_review,
  search,
  pages,
  account_management,
  site_administration,
  environment,
  logging,
  global_restricted_list,
  search_v3,
  alerts_v3,
  // TODO: Once the route is ready, this can be uncommented.
  // downloads
].flat(10);
