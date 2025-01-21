import axios from "axios";

declare module 'fastify' {
  interface FastifyInstance {
    discover(service: string): Promise<{
      data: any,
      status: number
    }>;
  }
}


export default async function (service: string) {
  const url = `http://localhost:8888/v1/apps/${service}/instance`;
  try {
    const { data, status } = await axios.get(url);
    return { data, status };
  } catch (err) {
    console.log(err);
    return { data: null, status: 500 };
  }
}