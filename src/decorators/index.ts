import discover from "./service_discovery";

// This uses a generic Function type to allow for any function to be passed in
// @eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const decorators = {
  discover: discover as (
    service: string,
  ) => Promise<{ route: string; error: Error | null }>,
};

export default decorators;
