import { afterAll, describe, expect, it, vi } from "vitest";
import build from "./build.js";

vi.mock("./plugins/index.js", () => ({ default: {} }));

describe("CORS preflight", () => {
  const app = build({}, []);

  afterAll(async () => {
    await app.close();
  });

  it.each(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"])(
    "allows %s from the ephemeral frontend",
    async (method) => {
      const origin =
        "https://jaip-frontend-4663ebs5-admin.apps.test.cirrostratus.org";
      const response = await app.inject({
        method: "OPTIONS",
        url: "/api/v2/request_management",
        headers: {
          origin,
          "access-control-request-method": method,
          "access-control-request-headers": "content-type",
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers["access-control-allow-origin"]).toBe(origin);
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
      expect(
        response.headers["access-control-allow-methods"]?.split(/,\s*/),
      ).toContain(method);
      expect(response.headers["access-control-allow-headers"]).toBe(
        "content-type",
      );
    },
  );

  it("does not allow an untrusted origin", async () => {
    const response = await app.inject({
      method: "OPTIONS",
      url: "/api/v2/request_management",
      headers: {
        origin: "https://example.com",
        "access-control-request-method": "DELETE",
      },
    });

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
