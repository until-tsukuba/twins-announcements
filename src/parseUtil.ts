export const parseDateString = (dateString: string) => {
    // 2025/12/04
    const match = dateString.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!match || !match[1] || !match[2] || !match[3]) {
        throw new Error(`Invalid date string format: ${dateString}`);
    }
    const year = +match[1];
    const month = +match[2];
    const day = +match[3];
    return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
};

export const parsePeriodString = (periodString: string): { start: string; end: string } => {
    // "2025/12/23 - 2026/1/23"
    const term = periodString.split(" - ");
    if (!term[0] || !term[1]) {
        throw new Error(`Invalid period string format: ${periodString}`);
    }
    const start = parseDateString(term[0]);
    const end = parseDateString(term[1]);
    return { start, end };
};
