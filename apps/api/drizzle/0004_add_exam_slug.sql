ALTER TABLE "exams" ADD COLUMN "slug" varchar(255);
UPDATE "exams" SET "slug" = 'exam-' || replace("id"::text, '-', '') WHERE "slug" IS NULL;
ALTER TABLE "exams" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "exams_course_slug_uniq" ON "exams" USING btree ("course_id", "slug");
