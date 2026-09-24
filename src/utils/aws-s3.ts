import { ensure_error } from "../utils/index.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import type { NodeJsClient } from "@smithy/types";
import type { S3ObjectMetadata, AbortableStream } from "../types/aws-s3.js";
import type { FastifyRequest } from "fastify";

const get_s3_environment = () => {
  const env = process.env.ENVIRONMENT?.toLowerCase();
  if (env === "development") return "test";
  if (env === "production") return "prod";
  return env; // fallback to original env if not dev or prod
};

const JAIP_S3_BUCKET_NAME = "ithaka-jaip";

/**
 * Creates and returns an S3 client instance
 * @returns S3 client configured for us-east-1 region
 */
export const get_s3_client = (): NodeJsClient<S3Client> => {
  return new S3Client({
    region: "us-east-1",
  }) as NodeJsClient<S3Client>;
};

/**
 * Constructs a full S3 URL for the JAIP bucket with environment prefix
 * @param path - Relative path within the bucket
 * @returns Full S3 URL
 */
export const get_jaip_s3_url = (path: string): string => {
  return `s3://${JAIP_S3_BUCKET_NAME}/${get_s3_environment()}/${path}`;
};

/**
 * Creates an S3 GetObjectCommand from a full S3 URL
 * @param s3_url - Full S3 URL (ex: s3://bucket/path/to/file)
 * @returns GetObjectCommand for the specified object
 */
export const get_s3_command = (s3_url: string): GetObjectCommand => {
  const url = new URL(s3_url);
  return new GetObjectCommand({
    Bucket: url.hostname,
    Key: url.pathname.substring(1),
  });
};

/**
 * Checks whether a value is a valid single HTTP byte range.
 *
 * @param range - The value to check for validity as a single HTTP byte range
 * @returns True if the range is a valid single HTTP byte range, false otherwise
 */
export const is_valid_byte_range = (
  range: string | undefined,
): boolean | Error => {
  try {
    if (range === undefined) {
      return false;
    }
    if (!range.startsWith("bytes=")) {
      throw new Error(`Invalid byte range: ${range}`);
    }

    // Remove the "bytes=" prefix to get the actual byte range value
    const value = range.slice("bytes=".length);

    // Check for suffix byte range (e.g., "-500").
    const suffix_match = /^-(\d+)$/.exec(value);

    // If it matches the suffix pattern, it is a valid suffix byte range, and we check that the length is greater than 0
    if (suffix_match) {
      if (BigInt(suffix_match[1]) <= 0) {
        throw new Error(
          `Invalid suffix byte range: ${range}. Length must be greater than 0.`,
        );
      }
      return BigInt(suffix_match[1]) > 0;
    }

    // Check for normal byte range (e.g., "0-499" or "500-999"). If it doesn't match, it's invalid.
    const range_match = /^(\d+)-(\d*)$/.exec(value);
    if (!range_match) {
      throw new Error(`Invalid byte range: ${range}`);
    }

    // If the end of the range is not specified, it is considered valid
    if (!range_match[2]) {
      return true;
    }

    // At this point, both start and end of the range are specified, so we check that the start is less than or equal to the end
    if (BigInt(range_match[1]) > BigInt(range_match[2])) {
      throw new Error(
        `Invalid byte range: ${range}. Start must be less than or equal to end.`,
      );
    }
    return BigInt(range_match[1]) <= BigInt(range_match[2]);
  } catch (err) {
    const error = ensure_error(err);
    const invalid_range_error = new Error(error.message);
    invalid_range_error.name = "InvalidByteRangeError";
    Object.assign(invalid_range_error, { status_code: 416 });
    return invalid_range_error;
  }
};

/**
 * Retrieves an S3 object as a readable stream. Also manages aborting the stream if the client connection closes.
 * This allows for PDF.js to use its native behavior for determining content size for HTTP byte ranges by calling
 * and then aborting the full stream.
 *
 * @param s3_url - Full S3 URL (ex: s3://bucket/path/to/file)
 * @param range - Optional HTTP byte range to request (ex: "bytes=0-499")
 *
 * @returns Tuple of [stream, error]
 */
export const attach_abortable_stream = (
  request: FastifyRequest,
  stream: NodeJS.ReadableStream | null | undefined,
) => {
  if (!stream || typeof stream !== "object") {
    return;
  }

  const raw = request.raw;
  if (!raw || typeof raw.once !== "function") {
    return;
  }

  const streamWithMethods = stream as AbortableStream;

  if (typeof streamWithMethods.once !== "function") {
    return;
  }

  const teardown = () => {
    if (
      typeof streamWithMethods.destroy === "function" &&
      !streamWithMethods.destroyed
    ) {
      streamWithMethods.destroy();
    }
    raw.removeListener("close", teardown);
    raw.removeListener("aborted", teardown);
  };

  raw.once("close", teardown);
  raw.once("aborted", teardown);
  streamWithMethods.once("close", () => {
    raw.removeListener("close", teardown);
    raw.removeListener("aborted", teardown);
  });
};

export const get_s3_object = async (
  s3_url: string,
  range?: string,
): Promise<[NodeJS.ReadableStream | null, Error | null, S3ObjectMetadata?]> => {
  try {
    const client = get_s3_client();
    const command = get_s3_command(s3_url);
    if (range) {
      command.input.Range = range;
    }

    const s3Response = await client.send(command);
    const s3ReadableStream = s3Response.Body;
    if (!s3ReadableStream) {
      throw new Error(`S3 object retrieval failed: No Body in response`);
    }

    return [
      s3ReadableStream,
      null,
      {
        content_range: s3Response.ContentRange,
        content_length: s3Response.ContentLength,
        accept_ranges: s3Response.AcceptRanges,
      },
    ];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

/**
 * Generates a presigned URL for S3 object access (1 hour expiry)
 * @param s3_url - Full S3 URL (ex: s3://bucket/path/to/file)
 * @returns Tuple of [presigned_url, error]
 */
export const get_presigned_url = async (
  s3_url: string,
): Promise<[string | null, Error | null]> => {
  try {
    const client = get_s3_client();
    const command = get_s3_command(s3_url);

    const signed_url = await getSignedUrl(client, command, { expiresIn: 3600 });

    return [signed_url, null];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};

/**
 * Finds and retrieves the first .json file from an S3 prefix
 * @param s3_url - Full S3 URL to use as search prefix
 * @returns Tuple of [parsed_json, error]
 */
export const get_json_from_s3 = async (
  s3_url: string,
): Promise<[object | null, Error | null]> => {
  try {
    const s3Client = get_s3_client();
    const url = new URL(s3_url);
    const path = url.pathname.substring(1); // Remove leading slash

    // List objects in the bucket with the given prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: url.hostname,
      Prefix: path + "/",
      Delimiter: "/",
    });

    const listResponse = await s3Client.send(listCommand);

    // Find the first object ending in .json
    const jsonObject = listResponse.Contents?.find((obj) =>
      obj.Key?.endsWith(".json"),
    );

    if (!jsonObject || !jsonObject.Key) {
      const error = Object.assign(new Error("No .json file found in bucket"), {
        status_code: 404,
      });
      throw error;
    }

    // Get the JSON object
    const getCommand = new GetObjectCommand({
      Bucket: url.hostname,
      Key: jsonObject.Key,
    });
    const getResponse = await s3Client.send(getCommand);

    // Convert stream to string and parse JSON
    const bodyString = await getResponse.Body?.transformToString();
    const jsonData = JSON.parse(bodyString || "{}") as object;
    return [jsonData, null];
  } catch (err) {
    const error = ensure_error(err);
    return [null, error];
  }
};
