import { S3Client } from "@aws-sdk/client-s3";
import { STORAGE_CONFIG } from "@/config/storage";

export const S3 = new S3Client({
  region: STORAGE_CONFIG.region,
  endpoint: STORAGE_CONFIG.endpoint,
  forcePathStyle: false,
});
