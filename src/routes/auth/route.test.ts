import axios from "axios";
import { build_test_server, dbMock } from "../../tests/helper";
import route_settings from "./routes";
import { get_sitecode_by_subdomain_resolved_value } from "../../tests/fixtures/auth/fixtures";

const app = build_test_server([route_settings]);

test('requests the "/auth" route', async () => {
  axios.post = jest.fn().mockResolvedValue({
    data: {
      data: {
        session: {
          uuid: "1234",
        },
      },
    },
    status: 200,
  });

  dbMock.get_sitecode_by_subdomain.mockResolvedValue(
    get_sitecode_by_subdomain_resolved_value,
  );

  dbMock.get_first_facility.mockResolvedValue();

  dbMock.get_ip_bypass.mockResolvedValue({
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

test('requests the "/auth" route with bad session', async () => {
  axios.post = jest.fn().mockResolvedValue({
    data: null,
    status: 500,
  });
  const res = await app.inject({
    method: "GET",
    url: "/auth",
  });
  expect(res.statusCode).toEqual(500);
});
