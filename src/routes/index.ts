// Import individual routes
import auth from "./auth/routes.js";
import subdomains from "./subdomains/routes.js";
import disciplines from "./disciplines/routes.js";
import healthcheck from "./healthchecks/routes.js";
import alerts from "./alerts/routes.js";
import media_review from "./media_review/routes.js";
import search from "./search/routes.js";
import pages from "./pages/routes.js";
import account_management from "./account_management/routes.js";
import site_administration from "./site_administration/index.js";
import environment from "./environment/routes.js";
import logging from "./logging/routes.js";
import global_restricted_list from "./global_restricted_list/routes.js";
import alerts_v3 from "./alerts_v3/routes.js";

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
  alerts_v3,
  // TODO: Once the route is ready, this can be uncommented.
  // downloads
].flat(10);
