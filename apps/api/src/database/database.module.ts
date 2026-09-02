import { Module } from '@nestjs/common';
import { db } from '@/database';

export const DATABASE = Symbol('DATABASE');

@Module({
    providers: [{ provide: DATABASE, useValue: db }],
    exports: [DATABASE],
})
export class DatabaseModule {}
