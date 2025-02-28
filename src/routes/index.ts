import auth from "./auth/routes";
import subdomains from "./subdomains/routes";
import disciplines from "./disciplines/routes";
import healthcheck from "./healthchecks/routes";
import alerts from "./alerts/routes";
export default [auth, healthcheck, subdomains, disciplines, alerts];
