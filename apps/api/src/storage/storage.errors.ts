import { InternalServerErrorException } from '@nestjs/common';

export const StorageUploadFailed = () => new InternalServerErrorException('Failed to upload object');
export const StorageListFailed = () => new InternalServerErrorException('Failed to list objects');
export const StorageUrlGenerationFailed = () => new InternalServerErrorException('Failed to generate object URL');
export const StorageDeleteFailed = () => new InternalServerErrorException('Failed to delete object');
