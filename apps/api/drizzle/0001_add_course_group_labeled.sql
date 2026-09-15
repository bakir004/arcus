UPDATE course_groups
SET name = CONCAT('Material group ', position + 1)
WHERE name IS NULL OR BTRIM(name) = '';

ALTER TABLE course_groups
    ALTER COLUMN name SET NOT NULL,
    ADD COLUMN labeled boolean DEFAULT true NOT NULL;
