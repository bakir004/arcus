ALTER TABLE course_groups
    DROP CONSTRAINT IF EXISTS course_groups_course_position_key,
    ADD CONSTRAINT course_groups_course_position_key UNIQUE (course_id, position)
        DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE course_materials
    DROP CONSTRAINT IF EXISTS course_materials_group_position_key,
    ADD CONSTRAINT course_materials_group_position_key UNIQUE (course_group_id, position)
        DEFERRABLE INITIALLY DEFERRED;
