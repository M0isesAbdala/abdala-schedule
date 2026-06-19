export function dateAt(y: number, mo: number, d: number, hh = 0, mm = 0, ss = 0): Date {
    return new Date(y, mo - 1, d, hh, mm, ss, 0);
}
