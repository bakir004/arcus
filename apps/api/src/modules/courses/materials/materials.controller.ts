import {
    Body,
    Controller,
    Delete,
    Get,
    // HttpCode,
    // HttpStatus,
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
    MaterialGroupResponseDto,
    MoveMaterialDto,
    ReorderMaterialGroupDto,
    materialCreateApiSchema,
    materialResponseApiSchema,
    materialResponseFromEntity,
    materialUpdateApiSchema,
} from './materials.dto';
import { MaterialsService } from './materials.service';

@ApiTags('Course Materials')
@ApiExtraModels(MaterialGroupResponseDto)
@Controller({ path: 'courses/:courseId/materials', version: '1' })
export class MaterialsController {
    constructor(private readonly service: MaterialsService) {}

    @Get()
    @ApiOperation({ summary: 'List course material groups' })
    @ApiParam({ name: 'courseId', format: 'uuid' })
    @ApiOkResponse({
        description: 'Course content ordered by group and material position.',
        schema: {
            type: 'array',
            items: { $ref: getSchemaPath(MaterialGroupResponseDto) },
        },
    })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    @ApiUnauthorizedResponse({ type: ErrorResponseDto })
    async findAll(@Param('courseId', ParseUUIDPipe) courseId: string) {
        const content = await this.service.findCourseContent(courseId);

        return content.map((group) => MaterialGroupResponseDto.fromEntity(group));
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

    @Patch('groups/:groupId/move')
    @ApiOperation({ summary: 'Move a material group to another position' })
    async moveGroup(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Param('groupId', ParseUUIDPipe) groupId: string,
        @Body() dto: ReorderMaterialGroupDto,
    ) {
        return this.service.moveGroup(courseId, groupId, dto.position);
    }

    @Delete('groups/:groupId')
    // @HttpCode(HttpStatus.NO_CONTENT)
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
        description: 'The input object is a discriminated union; input.kind selects its type-specific shape.',
        schema: materialCreateApiSchema,
    })
    @ApiCreatedResponse({
        description: 'The created material.',
        schema: materialResponseApiSchema,
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
        const material = await this.service.create(courseId, session.user.id, dto, file);

        return materialResponseFromEntity(material);
    }

    @Patch(':materialId/move')
    @ApiOperation({ summary: 'Move a material to another group and position' })
    async move(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Param('materialId', ParseUUIDPipe) materialId: string,
        @Body() dto: MoveMaterialDto,
    ) {
        return materialResponseFromEntity(await this.service.moveMaterial(courseId, materialId, dto));
    }

    @Get(':materialId/url')
    @ApiOperation({ summary: 'Get a temporary file material URL' })
    @ApiParam({ name: 'courseId', format: 'uuid' })
    @ApiParam({ name: 'materialId', format: 'uuid' })
    @ApiOkResponse({ schema: { type: 'object', properties: { url: { type: 'string', format: 'uri' } } } })
    @ApiBadRequestResponse({ type: ErrorResponseDto })
    @ApiNotFoundResponse({ type: ErrorResponseDto })
    @ApiUnauthorizedResponse({ type: ErrorResponseDto })
    async getFileUrl(
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Param('materialId', ParseUUIDPipe) materialId: string,
    ) {
        return { url: await this.service.getFileUrl(courseId, materialId) };
    }

    @Patch(':materialId')
    @ApiOperation({ summary: 'Update a course material' })
    @ApiParam({ name: 'courseId', format: 'uuid' })
    @ApiParam({ name: 'materialId', format: 'uuid' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description:
            'The optional input object is a discriminated union. When supplied, it completely replaces type-specific input.',
        schema: materialUpdateApiSchema,
    })
    @ApiOkResponse({
        description: 'The updated material.',
        schema: materialResponseApiSchema,
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
    // @HttpCode(HttpStatus.NO_CONTENT)
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
