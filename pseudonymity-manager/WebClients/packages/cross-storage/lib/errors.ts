// eslint-disable-next-line max-classes-per-file
export class CrossStorageTimeoutError extends Error {
    public trace = false;

    constructor() {
        super('Cross-storage timeout');
        Object.setPrototypeOf(this, CrossStorageTimeoutError.prototype);
    }
}

export class CrossStorageUnsupportedError extends Error {
    public trace = false;

    constructor() {
        super('Cross-storage unsupported');
        Object.setPrototypeOf(this, CrossStorageUnsupportedError.prototype);
    }
}
