export const Permissions = {
    CourseCreate: 'course:create',
    CourseManage: 'course:manage',
    CourseRead: 'course:read',
    CourseMemberRead: 'course:member:read',
    CourseMemberInvite: 'course:member:invite',
    CourseMemberRemove: 'course:member:remove',
    CourseRoleManage: 'course:role:manage',
    CourseMaterialCreate: 'course:material:create',
    CourseMaterialRead: 'course:material:read',
    CourseMaterialUpdate: 'course:material:update',
    CourseMaterialDelete: 'course:material:delete',
    AssignmentCreate: 'assignment:create',
    AssignmentRead: 'assignment:read',
    AssignmentUpdate: 'assignment:update',
    AssignmentDelete: 'assignment:delete',
    AssignmentSubmit: 'assignment:submit',
    AssignmentGrade: 'assignment:grade',

    ExamCreate: 'exam:create',
    ExamRead: 'exam:read',
    ExamUpdate: 'exam:update',
    ExamDelete: 'exam:delete',
    ExamPublish: 'exam:publish',

    QuestionCreate: 'question:create',
    QuestionRead: 'question:read',
    QuestionUpdate: 'question:update',
    QuestionDelete: 'question:delete',

    AttemptCreate: 'attempt:create',
    AttemptRead: 'attempt:read',
    AttemptReadAll: 'attempt:read-all',
    AttemptSubmit: 'attempt:submit',

    AnswerSave: 'answer:save',
    AnswerReadOwn: 'answer:read-own',
    AnswerReadAll: 'answer:read-all',
    AnswerGrade: 'answer:grade',

    AnnouncementCreate: 'announcement:create',
    AnnouncementRead: 'announcement:read',
    AnnouncementUpdate: 'announcement:update',
    AnnouncementDelete: 'announcement:delete',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
