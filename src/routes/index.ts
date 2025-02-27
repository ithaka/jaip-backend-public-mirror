import auth from "./auth/routes";
import subdomains from "./subdomains/routes";
import healthcheck from "./healthchecks/route";

export default [auth, healthcheck, subdomains];
