import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

// Mock aws-s3 functions
vi.mock("../../../utils/aws-s3.js", () => ({
  get_jaip_s3_url: vi.fn(),
  get_json_from_s3: vi.fn(),
}));

// Mock ANALYTICS_S3_PATH constant
vi.mock("../../../consts/index.js", () => ({
  ANALYTICS_S3_PATH: "analytics/mvp",
}));

import { get_json_from_s3, get_jaip_s3_url } from "../../../utils/aws-s3.js";
import { get_analytics_by_group_handler } from "../handlers.js";

const mockGetJaipS3Url = vi.mocked(get_jaip_s3_url);
const mockGetJsonFromS3 = vi.mocked(get_json_from_s3);

describe("Analytics handlers", () => {
  let mockFastify: FastifyInstance;
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFastify = {
      event_logger: {
        pep_standard_log_start: vi.fn(),
        pep_standard_log_complete: vi.fn(),
        pep_error: vi.fn(),
      },
    } as unknown as FastifyInstance;

    mockRequest = {
      params: { group_id: "123" },
    } as unknown as FastifyRequest;

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as FastifyReply;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("get_analytics_by_group_handler", () => {
    it("should successfully return analytics data for valid group_id", async () => {
      const mockAnalyticsData = { analytics: "test data" };
      const mockS3Url = "s3://ithaka-jaip/test/analytics/mvp/123";

      mockGetJaipS3Url.mockReturnValue(mockS3Url);
      mockGetJsonFromS3.mockResolvedValue([mockAnalyticsData, null]);

      const handler = get_analytics_by_group_handler(mockFastify);
      await handler(mockRequest, mockReply);

      expect(mockGetJaipS3Url).toHaveBeenCalledWith("analytics/mvp/123");
      expect(mockGetJsonFromS3).toHaveBeenCalledWith(mockS3Url);
      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({ data: mockAnalyticsData });
      expect(
        mockFastify.event_logger.pep_standard_log_start,
      ).toHaveBeenCalledWith("pep_get_analytics_by_group_start", mockRequest, {
        log_made_by: "analytics-api",
        event_description: "start to retrieve analytics for group 123",
        group_id: 123,
      });
      expect(
        mockFastify.event_logger.pep_standard_log_complete,
      ).toHaveBeenCalledWith(
        "pep_get_analytics_by_group_complete",
        mockRequest,
        mockReply,
        {
          log_made_by: "analytics-api",
          event_description:
            "successfully retrieved analytics data for group 123",
          group_id: 123,
        },
      );
    });

    it("should return 400 error when group_id is missing", async () => {
      mockRequest.params = {};
      const expectedErrorMsg =
        "Group ID is required to retrieve analytics data";

      const handler = get_analytics_by_group_handler(mockFastify);
      await handler(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(expectedErrorMsg);
      expect(mockFastify.event_logger.pep_error).toHaveBeenCalledWith(
        mockRequest,
        mockReply,
        { event_description: expectedErrorMsg },
        "analytics-api",
        expect.any(Error),
      );
      expect(mockGetJaipS3Url).not.toHaveBeenCalled();
      expect(mockGetJsonFromS3).not.toHaveBeenCalled();
    });

    it("should return 400 error when group_id is empty string", async () => {
      mockRequest.params = { group_id: "" };
      const expectedErrorMsg =
        "Group ID is required to retrieve analytics data";

      const handler = get_analytics_by_group_handler(mockFastify);
      await handler(mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(expectedErrorMsg);
      expect(mockFastify.event_logger.pep_error).toHaveBeenCalledWith(
        mockRequest,
        mockReply,
        { event_description: expectedErrorMsg },
        "analytics-api",
        expect.any(Error),
      );
      expect(mockGetJaipS3Url).not.toHaveBeenCalled();
      expect(mockGetJsonFromS3).not.toHaveBeenCalled();
    });

    it("should handle S3 errors gracefully", async () => {
      const mockError = new Error("S3 access error");
      const mockS3Url = "s3://ithaka-jaip/test/analytics/mvp/123";

      mockGetJaipS3Url.mockReturnValue(mockS3Url);
      mockGetJsonFromS3.mockResolvedValue([null, mockError]);

      const handler = get_analytics_by_group_handler(mockFastify);
      await handler(mockRequest, mockReply);

      expect(mockGetJaipS3Url).toHaveBeenCalledWith("analytics/mvp/123");
      expect(mockGetJsonFromS3).toHaveBeenCalledWith(mockS3Url);
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(mockError.message);
      expect(
        mockFastify.event_logger.pep_standard_log_start,
      ).toHaveBeenCalled();
      expect(mockFastify.event_logger.pep_error).toHaveBeenCalledWith(
        mockRequest,
        mockReply,
        {
          log_made_by: "analytics-api",
          event_description: "failed to retrieve analytics data for 123",
          group_id: 123,
        },
        "analytics",
        mockError,
      );
    });

    it("should parse group_id to integer for logging", async () => {
      const mockAnalyticsData = { analytics: "test data" };
      const mockS3Url = "s3://ithaka-jaip/test/analytics/mvp/456";

      mockRequest.params = { group_id: "456" };
      mockGetJaipS3Url.mockReturnValue(mockS3Url);
      mockGetJsonFromS3.mockResolvedValue([mockAnalyticsData, null]);

      const handler = get_analytics_by_group_handler(mockFastify);
      await handler(mockRequest, mockReply);

      expect(
        mockFastify.event_logger.pep_standard_log_start,
      ).toHaveBeenCalledWith("pep_get_analytics_by_group_start", mockRequest, {
        log_made_by: "analytics-api",
        event_description: "start to retrieve analytics for group 456",
        group_id: 456,
      });
    });

    it("should handle non-numeric group_id gracefully in logging", async () => {
      const mockAnalyticsData = { analytics: "test data" };
      const mockS3Url = "s3://ithaka-jaip/test/analytics/mvp/abc";

      mockRequest.params = { group_id: "abc" };
      mockGetJaipS3Url.mockReturnValue(mockS3Url);
      mockGetJsonFromS3.mockResolvedValue([mockAnalyticsData, null]);

      const handler = get_analytics_by_group_handler(mockFastify);
      await handler(mockRequest, mockReply);

      expect(
        mockFastify.event_logger.pep_standard_log_start,
      ).toHaveBeenCalledWith("pep_get_analytics_by_group_start", mockRequest, {
        log_made_by: "analytics-api",
        event_description: "start to retrieve analytics for group abc",
        group_id: NaN, // parseInt('abc', 10) returns NaN
      });
    });
  });
});
