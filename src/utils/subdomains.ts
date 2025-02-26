export const get_subdomain = (host: string): string => {
  return host.split(".").slice(0, -2).join(".");
};
