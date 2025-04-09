import service_discovery from "../real/service_discovery";

const options = {
  discover: jest.fn(() => {
    console.log("Mock discover function called");
    return ["service_discovery", null];
  }),
};

export default {
  options,
  plugin: service_discovery.plugin,
};
