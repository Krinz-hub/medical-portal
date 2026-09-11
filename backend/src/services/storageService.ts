/**
 * Storage Service Abstraction (Future AWS S3 Compatibility)
 * Implements clean abstraction layer allowing zero-effort transition to AWS S3.
 */

export interface IStorageService {
  uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
}

export class LocalStorageService implements IStorageService {
  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    // In local dev, store as base64 data URI or public static path
    const base64 = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // Local deletion logic if persisted to disk
    console.log(`[Storage] Deleted file: ${fileUrl.substring(0, 50)}...`);
  }
}

/**
 * Future AWS S3 Implementation
 */
export class S3StorageService implements IStorageService {
  private bucketName: string;

  constructor(bucketName: string = process.env.AWS_S3_BUCKET || 'doctor-visibility-uploads') {
    this.bucketName = bucketName;
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    // Future AWS SDK v3 PutObjectCommand
    console.log(`[AWS S3] Uploading ${fileName} to bucket ${this.bucketName}`);
    return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    console.log(`[AWS S3] Deleting object at ${fileUrl}`);
  }
}

export const storageService: IStorageService = new LocalStorageService();
