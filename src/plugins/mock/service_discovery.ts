import service_discovery from "../real/service_discovery";

// const options = {
//   discover: jest.fn(
//     ()=>{
//       console.log("Mock Service Discovery Plugin Called")
//     }
//   ),
// }

export default {
  options: service_discovery.options,
  plugin: service_discovery.plugin,
};
