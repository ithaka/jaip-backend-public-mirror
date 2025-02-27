import discover from "./service_discovery";

// This uses a generic Function type to allow for any function to be passed in
// @eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const decorators: {
  [key: string]: (service: string) => Promise<[string, Error | null]>;
} = {
  discover,
};

export default decorators;
