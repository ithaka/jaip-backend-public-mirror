import auth from "./auth/routes";
import subdomains from "./subdomains/routes";
import disciplines from "./disciplines/routes";
import healthcheck from "./healthchecks/routes";
import alerts from "./alerts/routes";
import media_review from "./media_review/routes";
import search from "./search/routes";
import pages from "./pages/routes";
import account_management from "./account_management/routes";

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
];
