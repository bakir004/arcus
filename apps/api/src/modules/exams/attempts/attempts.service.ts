import { BadRequestException, Injectable } from '@nestjs/common';
import { ExamVisibility } from '@/database/schema';
import { CreateAttemptDto } from '@/modules/exams/attempts/attempt.dto';
import { createAttemptSchema } from '@/modules/exams/attempts/attempt.entity';
import { AttemptsRepository } from '@/modules/exams/attempts/attempts.repository';

@Injectable()
export class AttemptsService {
    constructor(private readonly attemptsRepository: AttemptsRepository) {}

    async create(examId: string, studentId: string, dto: CreateAttemptDto) {
        const result = createAttemptSchema.safeParse(dto);
        if (!result.success) throw new BadRequestException(result.error.issues);

        await this.ensureAttemptStartAllowed(examId, studentId);
        return this.attemptsRepository.create(examId, studentId);
    }

    findAll(examId: string) {
        return this.attemptsRepository.findAllByExam(examId);
    }

    findAllOwn(examId: string, studentId: string) {
        return this.attemptsRepository.findAllByStudent(examId, studentId);
    }

    async findOwnById(examId: string, id: string, studentId: string) {
        const attempt = await this.attemptsRepository.findById(examId, id);
        if (attempt.studentId !== studentId) {
            throw new BadRequestException('attempt does not belong to user');
        }
        return attempt;
    }

    async submitOwn(examId: string, id: string, studentId: string) {
        await this.findOwnById(examId, id, studentId);
        return this.attemptsRepository.submit(examId, id);
    }

    private async ensureAttemptStartAllowed(examId: string, studentId: string): Promise<void> {
        const exam = await this.attemptsRepository.findExamForAttemptStart(examId, studentId);
        if (exam.visibility === ExamVisibility.Draft) {
            throw new BadRequestException('cannot start attempt for a draft exam');
        }

        const now = Date.now();
        const startsAt = exam.startsAt.getTime();
        const endsAt = startsAt + exam.durationMinutes * 60 * 1000;

        if (now < startsAt) throw new BadRequestException('cannot start attempt before exam start time');
        if (now >= endsAt) throw new BadRequestException('cannot start attempt after exam window has closed');

        const hasInProgress = await this.attemptsRepository.hasInProgressAttempt(examId, studentId);
        if (hasInProgress)
            throw new BadRequestException('cannot start a new attempt while an in-progress attempt exists');

        const totalAttempts = await this.attemptsRepository.countAttemptsByStudent(examId, studentId);
        if (totalAttempts >= exam.maxAttempts) {
            throw new BadRequestException('cannot start attempt because maxAttempts has been reached');
        }
    }
}
