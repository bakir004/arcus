import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

export const MaterialNotFound = (id: string) => new NotFoundException(`Course material ${id} not found`);
export const MaterialGroupNotFound = (id: string) => new NotFoundException(`Course material group ${id} not found`);
export const MaterialCreationFailed = () => new InternalServerErrorException('Failed to create course material');
export const MaterialGroupCreationFailed = () =>
    new InternalServerErrorException('Failed to create course material group');
export const InvalidMaterialRecord = (id: string) =>
    new InternalServerErrorException(`Course material ${id} does not have exactly one content record`);
