import path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '@/auth';
import { DatabaseModule } from '@/database/database.module';
import { CoursesModule } from './modules/courses/courses/courses.module';
import { ExamsModule } from './modules/exams/exams/exams.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: path.resolve(__dirname, '../.env'),
        }),
        DatabaseModule,
        AuthModule.forRoot({
            auth,
            disableGlobalAuthGuard: false,
        }),
        CoursesModule,
        ExamsModule,
    ],
})
export class AppModule {}
