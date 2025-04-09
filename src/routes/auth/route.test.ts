import axios from "axios";
import { build_test_server } from "../../test/helpers";
import route_settings from "./routes";

// beforeEach(() => {
//   mockCtx = createMockContext()
//   ctx = mockCtx as unknown as Context
// })

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

  // db.facilities.findFirst = jest.fn().mockResolvedValue({
  //   id: "1234",
  //   name: "Test Facility",
  //   code: "TEST",
  //   type: "library",
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // });

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
