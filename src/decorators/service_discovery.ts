import axios from "axios";
import { ensure_error } from "../utils";
import { JSTORInstance, JSTORInstanceError } from "../types/services";
declare module "fastify" {
  interface FastifyInstance {
    discover(service: string): Promise<{
      route: string;
      error: Error;
    }>;
  }
}

export default async function (
  service: string,
): Promise<{ route: string; error: Error | null }> {
  const url = `http://localhost:8888/v1/apps/${service}/instances`;
  try {
    const {
      data,
      status,
    }: { data: JSTORInstance[] | JSTORInstanceError; status: number } =
      await axios.get(url);
    if (status !== 200) {
      const msg =
        "error" in data
          ? data.error
          : "Service discovery failed: Status code not 200";
      throw new Error(msg);
    }
    if (Array.isArray(data)) {
      if (data.length) {
        const homePageUrl = data.find(
          (instance: JSTORInstance) => instance.homePageUrl,
        );
        if (homePageUrl) {
          return {
            route: homePageUrl.homePageUrl,
            error: null,
          };
        } else {
          throw new Error(
            "Service discovery failed: No homepage URLs found in instances",
          );
        }
      } else {
        throw new Error("Service discovery failed: No instances found");
      }
    } else {
      throw new Error("Service discovery failed: Response is not an array");
    }
  } catch (err) {
    const error = ensure_error(err);
    return {
      route: "",
      error,
    };
  }
}
