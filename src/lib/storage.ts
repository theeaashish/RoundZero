import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { STORAGE_CONFIG } from "@/config/storage";
import { S3 } from "./s3-client";

// Storage path prefixes
export const STORAGE_PATHS = {
  INTERVIEWS: "interviews",
  RESUMES: "resumes",
  AUDIO: "audio",
} as const;

export type StoragePath = (typeof STORAGE_PATHS)[keyof typeof STORAGE_PATHS];

// Content types
export const CONTENT_TYPES = {
  WAV: "audio/wav",
  MP3: "audio/mpeg",
  WEBM: "audio/webm",
  PDF: "application/pdf",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

type InterviewAudioContentType =
  | typeof CONTENT_TYPES.WAV
  | typeof CONTENT_TYPES.MP3;

export interface UploadOptions {
  contentType: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url: string;
}

export const getInterviewAudioKey = (
  interviewId: string,
  messageId: string,
  extension: "wav" | "mp3" = "wav",
) =>
  `${STORAGE_PATHS.INTERVIEWS}/${interviewId}/${STORAGE_PATHS.AUDIO}/${messageId}.${extension}`;

// Storage service for S3 operations
export const storageService = {
  // Upload a buffer to S3 and return the public URL
  async upload(
    buffer: Buffer,
    path: string,
    filename: string,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const key = `${path}/${filename}`;

    await S3.send(
      new PutObjectCommand({
        Bucket: STORAGE_CONFIG.bucketName,
        Key: key,
        Body: buffer,
        ContentType: options.contentType,
        Metadata: options.metadata,
      }),
    );

    return {
      key,
      url: STORAGE_CONFIG.getPublicUrl(key),
    };
  },

  // Upload message audio to a deterministic key so retries are idempotent.
  async uploadInterviewAudio(
    buffer: Buffer,
    interviewId: string,
    messageId: string,
    contentType: InterviewAudioContentType = CONTENT_TYPES.WAV,
  ): Promise<string> {
    const extension = contentType === CONTENT_TYPES.MP3 ? "mp3" : "wav";
    const key = getInterviewAudioKey(interviewId, messageId, extension);

    await S3.send(
      new PutObjectCommand({
        Bucket: STORAGE_CONFIG.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return key;
  },

  // Download a file from S3
  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: STORAGE_CONFIG.bucketName,
      Key: key,
    });

    const response = await S3.send(command);

    if (!response.Body) {
      throw new Error("Failed to download file from S3: No body returned");
    }

    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  },

  // Generate a presigned URL for client-side upload
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: STORAGE_CONFIG.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(S3, command, { expiresIn });
  },

  // Generate a presigned URL for downloading
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: STORAGE_CONFIG.bucketName,
      Key: key,
    });

    return getSignedUrl(S3, command, { expiresIn });
  },

  // Build a public URL for a given key
  getPublicUrl(key: string): string {
    return STORAGE_CONFIG.getPublicUrl(key);
  },
};
