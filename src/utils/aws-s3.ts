import { ensure_error } from "../utils/index.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import type { NodeJsClient } from "@smithy/types";

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
 * Retrieves an S3 object as a readable stream
 * @param s3_url - Full S3 URL (ex: s3://bucket/path/to/file)
 * @returns Tuple of [stream, error]
 */
export const get_s3_object = async (
  s3_url: string,
): Promise<[NodeJS.ReadableStream | null, Error | null]> => {
  try {
    const client = get_s3_client();
    const command = get_s3_command(s3_url);

    const s3Response = await client.send(command);
    const s3ReadableStream = s3Response.Body;
    if (!s3ReadableStream) {
      throw new Error(`S3 object retrieval failed: No Body in response`);
    }

    return [s3ReadableStream, null];
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
      Prefix: path,
    });

    const listResponse = await s3Client.send(listCommand);

    // Find the first object ending in .json
    const jsonObject = listResponse.Contents?.find((obj) =>
      obj.Key?.endsWith(".json"),
    );

    if (!jsonObject || !jsonObject.Key) {
      const error = Object.assign(new Error("No .json file found in bucket"), {
        statusCode: 404,
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
