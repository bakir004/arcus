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
    ApiBody,
    ApiConsumes,
    ApiCreatedResponse,
    ApiExtraModels,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
    ApiUnauthorizedResponse,
    getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@/common/error.dto';
import {
    CreateMaterialDto,
    CreateMaterialGroupDto,
    EditMaterialDto,
    EditMaterialGroupDto,
    FileMaterialResponseDto,
    LinkMaterialResponseDto,
    MaterialGroupResponseDto,
    TextMaterialResponseDto,
    materialCreateApiSchema,
    materialResponseFromEntity,
    materialUpdateApiSchema,
} from './materials.dto';
import { MaterialsService } from './materials.service';

@ApiTags('Courses')
@ApiExtraModels(MaterialGroupResponseDto, TextMaterialResponseDto, FileMaterialResponseDto, LinkMaterialResponseDto)
@Controller({ path: 'courses/:courseId/materials', version: '1' })
export class MaterialsController {
    constructor(private readonly service: MaterialsService) {}

    @Get()
    @ApiOperation({ summary: 'List course materials and material groups' })
    @ApiParam({ name: 'courseId', format: 'uuid' })
    @ApiOkResponse({
        description: 'Course content ordered by group and material position.',
        schema: {
            type: 'array',
            items: {
                oneOf: [
                    { $ref: getSchemaPath(MaterialGroupResponseDto) },
                    { $ref: getSchemaPath(TextMaterialResponseDto) },
                    { $ref: getSchemaPath(FileMaterialResponseDto) },
                    { $ref: getSchemaPath(LinkMaterialResponseDto) },
                ],
            },
        },
    })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    @ApiUnauthorizedResponse({ type: ErrorResponseDto })
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
    @ApiParam({ name: 'courseId', format: 'uuid' })
    @ApiBody({ type: CreateMaterialGroupDto })
    @ApiCreatedResponse({ type: MaterialGroupResponseDto })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    @ApiUnauthorizedResponse({ type: ErrorResponseDto })
    async createGroup(@Param('courseId', ParseUUIDPipe) courseId: string, @Body() dto: CreateMaterialGroupDto) {
        return this.service.createGroup(courseId, dto);
    }

    @Patch('groups/:groupId')
    @ApiOperation({ summary: 'Update a material group' })
    @ApiParam({ name: 'courseId', format: 'uuid' })
    @ApiParam({ name: 'groupId', format: 'uuid' })
    @ApiBody({ type: EditMaterialGroupDto })
    @ApiOkResponse({ type: MaterialGroupResponseDto })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    @ApiUnauthorizedResponse({ type: ErrorResponseDto })
    async updateGroup(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Param('groupId', ParseUUIDPipe) groupId: string,
        @Body() dto: EditMaterialGroupDto,
    ) {
        return this.service.editGroup(courseId, groupId, dto);
    }

    @Delete('groups/:groupId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a material group' })
    @ApiParam({ name: 'courseId', format: 'uuid' })
    @ApiParam({ name: 'groupId', format: 'uuid' })
    @ApiNoContentResponse()
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    @ApiUnauthorizedResponse({ type: ErrorResponseDto })
    async deleteGroup(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Param('groupId', ParseUUIDPipe) groupId: string,
    ) {
        await this.service.deleteGroup(courseId, groupId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a course material' })
    @ApiParam({ name: 'courseId', format: 'uuid' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'The kind property discriminates the required type-specific fields.',
        schema: materialCreateApiSchema,
    })
    @ApiCreatedResponse({
        description: 'The created material.',
        schema: {
            oneOf: [
                { $ref: getSchemaPath(TextMaterialResponseDto) },
                { $ref: getSchemaPath(FileMaterialResponseDto) },
                { $ref: getSchemaPath(LinkMaterialResponseDto) },
            ],
        },
    })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    @ApiUnauthorizedResponse({ type: ErrorResponseDto })
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 25 * 1024 * 1024 },
        }),
    )
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
    @ApiOperation({ summary: 'Update a course material' })
    @ApiParam({ name: 'courseId', format: 'uuid' })
    @ApiParam({ name: 'materialId', format: 'uuid' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description:
            'The kind property discriminates the type-specific fields. All fields are optional when retaining the current kind.',
        schema: materialUpdateApiSchema,
    })
    @ApiOkResponse({
        description: 'The updated material.',
        schema: {
            oneOf: [
                { $ref: getSchemaPath(TextMaterialResponseDto) },
                { $ref: getSchemaPath(FileMaterialResponseDto) },
                { $ref: getSchemaPath(LinkMaterialResponseDto) },
            ],
        },
    })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    @ApiUnauthorizedResponse({ type: ErrorResponseDto })
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 25 * 1024 * 1024 },
        }),
    )
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
    @ApiOperation({ summary: 'Delete a course material' })
    @ApiParam({ name: 'courseId', format: 'uuid' })
    @ApiParam({ name: 'materialId', format: 'uuid' })
    @ApiNoContentResponse()
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    @ApiUnauthorizedResponse({ type: ErrorResponseDto })
    async remove(@Param('courseId', ParseUUIDPipe) courseId: string, @Param('materialId', ParseUUIDPipe) id: string) {
        await this.service.delete(courseId, id);
    }
}
