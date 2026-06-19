export declare function makeCounter(): {
    count: number;
    calls: unknown[];
} & {
    cb: (arg: unknown) => void;
};
