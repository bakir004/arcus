import path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '@/auth';
import { AuthzModule } from '@/authz/authz.module';
import { MeController } from '@/common/me.controller';
import { DatabaseModule } from '@/database/database.module';
import { CoursesModule } from './modules/courses/courses/courses.module';
import { MaterialsModule } from './modules/courses/materials/materials.module';
import { RolesModule } from './modules/courses/roles/roles.module';
import { ExamsModule } from './modules/exams/exams/exams.module';
import { QuestionsModule } from './modules/exams/questions/questions.module';
import { StorageModule } from './storage/storage.module';

@Module({
    controllers: [MeController],
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: path.resolve(__dirname, '../.env'),
        }),
        DatabaseModule,
        AuthzModule,
        AuthModule.forRoot({
            auth,
            disableGlobalAuthGuard: false,
        }),
        CoursesModule,
        MaterialsModule,
        RolesModule,
        ExamsModule,
        QuestionsModule,
        StorageModule,
    ],
})
export class AppModule {}
