export function hasRole(roles: string[] | undefined, role: string) {
    return roles?.some((candidate) => candidate.toLowerCase() === role.toLowerCase()) ?? false;
}

export function isStudentRole(roles: string[] | undefined) {
    return hasRole(roles, 'student');
}

export function isProfessorRole(roles: string[] | undefined) {
    return hasRole(roles, 'professor');
}
