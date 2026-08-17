import { NotFoundException } from '@nestjs/common';

export const TodoNotFound = (id: string): NotFoundException =>
    new NotFoundException(`Todo ${id} not found`);
