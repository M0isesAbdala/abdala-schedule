export function makeCounter() {
    const result = { count: 0, calls: [] as unknown[] };
    const cb = (arg: unknown) => { result.count++; result.calls.push(arg); };
    return Object.assign(result, { cb });
}
