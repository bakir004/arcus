SELECT * FROM assignments
WHERE assignment_id = 1;

UPDATE assignments SET 
    title = 'Updated Assignment Title',
    description = 'This is an updated description for the assignment.',
    due_date = '2024-12-31'
WHERE assignment_id = 1;
