export function startOfSemester(date: Date): Date {
    const year = date.getFullYear();
    const month = date.getMonth();

    // First semester: January - June
    // Second semester: July - December
    const semesterStart = month < 6 ?
        new Date(year, 0, 1) : // January 1st
        new Date(year, 6, 1);  // July 1st

    return semesterStart;
}

export function endOfSemester(date: Date): Date {
    const year = date.getFullYear();
    const month = date.getMonth();

    // First semester ends June 30th
    // Second semester ends December 31st
    const semesterEnd = month < 6 ?
        new Date(year, 5, 30) : // June 30th
        new Date(year, 11, 31); // December 31st

    return semesterEnd;
}