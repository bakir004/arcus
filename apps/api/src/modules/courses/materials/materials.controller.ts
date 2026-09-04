import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { auth } from '@/auth';
import {
    ApiBadRequestResponse,
    ApiConsumes,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/error.dto';
import { MaterialsService } from './materials.service';
import { CreateMaterialGroupDto } from './dto/create-group.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { EditMaterialGroupDto } from './dto/edit-group.dto';
import { EditMaterialDto } from './dto/edit-material.dto';
import { MaterialGroupResponseDto } from './dto/group-response.dto';
import { materialResponseFromEntity } from './dto/material-response.dto';

@ApiTags('Courses')
@Controller('courses/:courseId/materials')
export class MaterialsController {
    constructor(private readonly service: MaterialsService) {}

    @Get()
    @ApiOperation({ summary: 'List course materials' })
    @ApiParam({ name: 'courseId', format: 'uuid' })
    @ApiOkResponse({ type: Object, isArray: true })
    async findAll(@Param('courseId', ParseUUIDPipe) courseId: string) {
        const content = await this.service.findCourseContent(courseId);

        return content.map((item) => {
            if ('materials' in item) {
                return MaterialGroupResponseDto.fromEntity(item);
            }

            return materialResponseFromEntity(item.material);
        });
    }

    @Post('groups')
    @ApiOperation({ summary: 'Create a material group' })
    @ApiCreatedResponse({ type: MaterialGroupResponseDto })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    async createGroup(@Param('courseId', ParseUUIDPipe) courseId: string, @Body() dto: CreateMaterialGroupDto) {
        return this.service.createGroup(courseId, dto);
    }

    @Patch('groups/:groupId')
    async updateGroup(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Param('groupId', ParseUUIDPipe) groupId: string,
        @Body() dto: EditMaterialGroupDto,
    ) {
        return this.service.editGroup(courseId, groupId, dto);
    }

    @Delete('groups/:groupId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse()
    async deleteGroup(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Param('groupId', ParseUUIDPipe) groupId: string,
    ) {
        await this.service.deleteGroup(courseId, groupId);
    }

    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 25 * 1024 * 1024 },
        }),
    )
    @ApiConsumes('multipart/form-data')
    @ApiCreatedResponse({ type: Object })
    async create(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Session() session: UserSession<typeof auth>,
        @Body() dto: CreateMaterialDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const material = await this.service.create(courseId, session.user.id, dto, file, dto.groupId);

        return materialResponseFromEntity(material);
    }

    @Patch(':materialId')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 25 * 1024 * 1024 },
        }),
    )
    @ApiConsumes('multipart/form-data')
    async update(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Param('materialId', ParseUUIDPipe) id: string,
        @Body() dto: EditMaterialDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const material = await this.service.edit(courseId, id, dto, file);

        return materialResponseFromEntity(material);
    }

    @Delete(':materialId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('courseId', ParseUUIDPipe) courseId: string, @Param('materialId', ParseUUIDPipe) id: string) {
        await this.service.delete(courseId, id);
    }
}
