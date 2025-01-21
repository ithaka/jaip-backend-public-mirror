import axios from "axios";

declare module "fastify" {
  interface FastifyInstance {
    discover(service: string): Promise<{
      route: string;
      error: Error;
    }>;
  }
}

export default async function (service: string) {
  const url = `http://localhost:8888/v1/apps/${service}/instances`;
  try {
    const { data, status } = await axios.get(url);
    if (status !== 200) {
      throw new Error("Service discovery failed: Status code not 200");
    }
    if (Array.isArray(data)) {
      if (data.length) {
        const homePageUrl = data.find((instance: any) => instance.homePageUrl);
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
    console.log(err);
    return {
      route: "",
      error: err,
    };
  }
}
