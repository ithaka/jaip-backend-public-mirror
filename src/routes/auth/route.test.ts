import { build_test_server, db_mock, discover_mock } from "../../tests/helpers";
import route_settings from "./routes";
import {
  get_first_facility_resolved_value,
  get_sitecode_by_subdomain_resolved_value,
} from "../../tests/fixtures/auth/fixtures";
import axios from "axios";

const app = build_test_server([route_settings]);

test('requests the "/auth" route with ip bypass', async () => {
  discover_mock.mockResolvedValue(["url", null]);
  axios.post = jest.fn().mockResolvedValue({
    data: {
      data: {
        session: {
          uuid: "uuid",
        },
      },
    },
    status: 200,
  });
  db_mock.get_sitecode_by_subdomain.mockResolvedValue(
    get_sitecode_by_subdomain_resolved_value,
  );

  db_mock.get_first_facility.mockResolvedValue(
    get_first_facility_resolved_value,
  );

  db_mock.get_ip_bypass.mockResolvedValue({
    facilities: {
      jstor_id: "jstor.org",
    },
  });

  const res = await app.inject({
    method: "GET",
    url: "/auth",
  });
  expect(res.statusCode).toEqual(200);
});

// test('requests the "/auth" route with bad session', async () => {
//   axios.post = jest.fn().mockResolvedValue({
//     data: null,
//     status: 500,
//   });
//   const res = await app.inject({
//     method: "GET",
//     url: "/auth",
//   });
//   expect(res.statusCode).toEqual(500);
// });
