import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
    ArrayMinSize,
    ArrayUnique,
    IsArray,
    IsInt,
    IsNumber,
    IsObject,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateIf,
} from 'class-validator';
import { QuestionType } from '@/database/schema';
import { getAllQuestionRepositories } from '@/modules/exams/questions/questions.repository.registry';

const optionsApiProperty = {
    oneOf: getAllQuestionRepositories().map((repository) => repository.optionsApiSchema),
};

const optionsResponseApiProperty = {
    oneOf: getAllQuestionRepositories().map((repository) => {
        const schema = repository.optionsApiSchema as Record<string, unknown>;
        if (repository.type !== QuestionType.MultipleChoice) return schema;

        return {
            type: 'object',
            title: 'MultipleChoiceOptionsResponse',
            required: ['type', 'choices', 'correctIndices', 'multipleAnswers'],
            properties: {
                type: { const: QuestionType.MultipleChoice, type: 'string' },
                choices: { type: 'array', items: { type: 'string' } },
                correctIndices: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Redacted in fetch responses and always returned as an empty array.',
                    example: [],
                },
                multipleAnswers: {
                    type: 'boolean',
                    description:
                        'Derived from the number of correct answers (true when more than one correct answer exists).',
                    example: false,
                },
            },
        } satisfies Record<string, unknown>;
    }),
};

export class CreateQuestionDto {
    @ApiProperty({
        description: 'Question text displayed to students.',
        example: 'What is the time complexity of binary search?',
        minLength: 1,
        maxLength: 4000,
    })
    @IsString()
    @MinLength(1)
    @MaxLength(4000)
    prompt: string;

    @ApiProperty({
        description: 'Display order of the question within the exam, starting at 1. Must be unique per exam.',
        example: 1,
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    position: number;

    @ApiProperty({
        description: 'Point value awarded for a correct answer. Accepts up to 2 decimal places.',
        example: 5,
        minimum: 0.01,
        maximum: 100,
    })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'points must have at most 2 decimal places (e.g. 1.25)' })
    @Min(0.01)
    @Max(100)
    points: number;

    @ApiProperty({
        ...optionsApiProperty,
        description: 'Type-specific question configuration. The shape depends on the type discriminant.',
    })
    @IsObject()
    options: object;
}

export class ReorderQuestionsDto {
    @ApiProperty({
        description: 'All question ids in their desired order.',
        type: [String],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique()
    @IsUUID('4', { each: true })
    questionIds: string[];
}

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {
    @ApiProperty({
        ...optionsApiProperty,
        required: false,
        description:
            'Type-specific question configuration. Replaces the entire options object as-is when provided (no deep merge/patching).',
    })
    @ValidateIf((object: UpdateQuestionDto) => object.options !== undefined)
    @IsObject()
    declare options?: object;
}

export class QuestionResponseDto {
    @ApiProperty({
        format: 'uuid',
        description: 'Unique identifier of the question.',
    })
    id: string;

    @ApiProperty({
        format: 'uuid',
        description: 'Gradeable exam item represented by this question.',
    })
    examItemId: string;

    @ApiProperty({
        format: 'uuid',
        description: 'Identifier of the exam this question belongs to.',
    })
    examId: string;

    @ApiProperty({
        description: 'Question text displayed to students.',
        example: 'What is the time complexity of binary search?',
    })
    prompt: string;

    @ApiProperty({
        description: 'Display order of this question within the exam, starting at 1.',
        example: 3,
    })
    position: number;

    @ApiProperty({
        description: 'Maximum score for this question as a fixed-point string.',
        example: '5.00',
    })
    points: string;

    @ApiProperty({
        ...optionsResponseApiProperty,
        description: 'Type-specific question configuration.',
    })
    options: object;

    @ApiProperty({
        description: 'Timestamp when the question was created.',
        format: 'date-time',
    })
    createdAt: string;
}
