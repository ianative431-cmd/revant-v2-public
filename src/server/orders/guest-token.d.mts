export function createGuestOrderTrackingToken(idempotencyKey: string, quantity: number, secret: string, variantLabel?: string | null): string;
export function createGuestCartTrackingToken(idempotencyKey: string, cartFingerprint: string, secret: string): string;
export function hashGuestTrackingToken(token: string): string;
