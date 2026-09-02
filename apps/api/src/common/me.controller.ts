import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { OptionalAuth, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { auth } from '@/auth';
import { AuthzService } from '@/authz/authz.service';

export class MeUserDto {
    @ApiProperty({ description: 'User id.' })
    id: string;

    @ApiProperty({ description: 'User name.' })
    name: string;

    @ApiProperty({ description: 'User email.' })
    email: string;

    @ApiPropertyOptional({ description: 'User image.', nullable: true })
    image?: string | null;
}

export class MeSessionDto {
    @ApiProperty({ description: 'Session id.' })
    id: string;

    @ApiProperty({ description: 'User id associated with the session.' })
    userId: string;

    @ApiProperty({ description: 'Session expiration time.', format: 'date-time' })
    expiresAt: Date;

    @ApiProperty({ description: 'Session creation time.', format: 'date-time' })
    createdAt: Date;

    @ApiProperty({ description: 'Session last update time.', format: 'date-time' })
    updatedAt: Date;

    @ApiPropertyOptional({ description: 'IP address used to create the session.', nullable: true })
    ipAddress?: string | null;

    @ApiPropertyOptional({ description: 'User agent used to create the session.', nullable: true })
    userAgent?: string | null;
}

export class MeResponseDto {
    @ApiProperty({ type: MeUserDto })
    user: MeUserDto;

    @ApiProperty({ type: MeSessionDto })
    session: MeSessionDto;

    @ApiProperty({ type: [String], description: 'Assigned roles.' })
    roles: string[];

    @ApiProperty({ type: [String], description: 'Effective permissions.' })
    permissions: string[];
}

@ApiTags('Auth')
@Controller({ path: 'me', version: '1' })
@OptionalAuth()
export class MeController {
    private readonly logger = new Logger(MeController.name);

    constructor(private readonly authzService: AuthzService) {}

    @Get()
    @ApiOperation({ summary: 'Get current authenticated user context' })
    @ApiOkResponse({ description: 'Current user context or null.', type: MeResponseDto })
    async findMe(@Session() session: UserSession<typeof auth> | null): Promise<MeResponseDto | null> {
        if (!session) return null;

        const context = await this.authzService.getUserAuthzContext(session.user.id).catch((error) => {
            this.logger.warn(
                `failed to load authz context for /me: ${error instanceof Error ? error.message : String(error)}`,
            );
            return { roles: [], permissions: [] };
        });

        return {
            user: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
            },
            session: session.session,
            roles: context.roles,
            permissions: context.permissions,
        };
    }
}
