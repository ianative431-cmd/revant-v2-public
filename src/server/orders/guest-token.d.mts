export function createGuestOrderTrackingToken(idempotencyKey: string, quantity: number, secret: string): string;
export function hashGuestTrackingToken(token: string): string;
