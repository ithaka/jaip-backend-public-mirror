export interface S3ObjectMetadata {
  content_range?: string;
  content_length?: number;
  accept_ranges?: string;
}

export interface AbortableStream extends NodeJS.ReadableStream {
  destroyed?: boolean;
  once?: (
    event: string,
    listener: (...args: unknown[]) => void,
  ) => NodeJS.ReadableStream;
  destroy?: (error?: Error) => void;
}
