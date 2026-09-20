import { ApiProperty } from '@nestjs/swagger';

export class AnswerTableResponseDto {
    @ApiProperty({ type: [Object] }) items: object[];
    @ApiProperty({ type: [Object] }) rows: object[];
}
