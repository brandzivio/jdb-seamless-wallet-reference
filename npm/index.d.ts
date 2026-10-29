export interface Keys { key: string | Buffer; iv: string | Buffer }
export function decryptPayload(x: string, keys: Keys): any;
export function encryptPayload(obj: unknown, keys: Keys): string;
