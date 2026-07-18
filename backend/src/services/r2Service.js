const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../config');
const logger = require('../utils/logger');
const { generateUUID } = require('../utils/helpers');

let s3Client = null;

function getS3Client() {
  if (s3Client) {return s3Client;}

  if (!config.r2.endpoint || !config.r2.accessKeyId || !config.r2.secretAccessKey) {
    logger.warn('Cloudflare R2 credentials not fully configured. R2 operations will fail.');
  }

  s3Client = new S3Client({
    region: config.r2.region,
    endpoint: config.r2.endpoint,
    credentials: {
      accessKeyId: config.r2.accessKeyId,
      secretAccessKey: config.r2.secretAccessKey,
    },
    requestHandler: {
      requestTimeout: 300000,
    },
    forcePathStyle: true,
  });

  return s3Client;
}

const r2Service = {
  getClient() {
    return getS3Client();
  },

  async uploadFile(fileBuffer, fileName, mimeType, folder = 'movies') {
    const client = getS3Client();
    const key = `${folder}/${generateUUID()}-${fileName}`;

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: config.r2.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
        }),
      );

      logger.info('File uploaded to R2', { key, bucket: config.r2.bucket });
      return { key };
    } catch (err) {
      logger.error('R2 upload failed', { error: err.message, key });
      throw new Error('Failed to upload file to storage');
    }
  },

  async uploadStream(readStream, fileName, mimeType, folder = 'movies') {
    const client = getS3Client();
    const key = `${folder}/${generateUUID()}-${fileName}`;

    try {
      const chunks = [];
      for await (const chunk of readStream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      await client.send(
        new PutObjectCommand({
          Bucket: config.r2.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );

      logger.info('File stream uploaded to R2', { key, bucket: config.r2.bucket });
      return { key };
    } catch (err) {
      logger.error('R2 stream upload failed', { error: err.message, key });
      throw new Error('Failed to upload file stream to storage');
    }
  },

  async getFile(key) {
    const client = getS3Client();
    try {
      const response = await client.send(
        new GetObjectCommand({
          Bucket: config.r2.bucket,
          Key: key,
        }),
      );
      return response;
    } catch (err) {
      logger.error('R2 get file failed', { error: err.message, key });
      throw new Error('Failed to retrieve file from storage');
    }
  },

  async getFileStream(key, range) {
    const client = getS3Client();
    try {
      const commandParams = {
        Bucket: config.r2.bucket,
        Key: key,
      };
      if (range) {
        commandParams.Range = range;
      }

      const response = await client.send(new GetObjectCommand(commandParams));
      return response;
    } catch (err) {
      logger.error('R2 get file stream failed', { error: err.message, key });
      throw new Error('Failed to stream file from storage');
    }
  },

  async getSignedDownloadUrl(key, expiresIn = 3600) {
    const client = getS3Client();
    try {
      const command = new GetObjectCommand({
        Bucket: config.r2.bucket,
        Key: key,
        ResponseContentDisposition: 'attachment',
      });

      const url = await getSignedUrl(client, command, { expiresIn });
      return url;
    } catch (err) {
      logger.error('R2 sign URL failed', { error: err.message, key });
      throw new Error('Failed to generate download URL');
    }
  },

  async getSignedStreamUrl(key, expiresIn = 3600) {
    const client = getS3Client();
    try {
      const command = new GetObjectCommand({
        Bucket: config.r2.bucket,
        Key: key,
      });

      const url = await getSignedUrl(client, command, { expiresIn });
      return url;
    } catch (err) {
      logger.error('R2 sign stream URL failed', { error: err.message, key });
      throw new Error('Failed to generate stream URL');
    }
  },

  async deleteFile(key) {
    const client = getS3Client();
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: config.r2.bucket,
          Key: key,
        }),
      );
      logger.info('File deleted from R2', { key });
      return true;
    } catch (err) {
      logger.error('R2 delete failed', { error: err.message, key });
      throw new Error('Failed to delete file from storage');
    }
  },

  async getFileMetadata(key) {
    const client = getS3Client();
    try {
      const response = await client.send(
        new HeadObjectCommand({
          Bucket: config.r2.bucket,
          Key: key,
        }),
      );
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
      };
    } catch (err) {
      logger.error('R2 head object failed', { error: err.message, key });
      return null;
    }
  },

  async getPublicUrl(key) {
    if (config.r2.publicUrl) {
      return `${config.r2.publicUrl}/${key}`;
    }
    return null;
  },
};

module.exports = r2Service;
