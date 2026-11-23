export function createGuestOrderTrackingToken(idempotencyKey: string, quantity: number, secret: string, variantLabel?: string | null): string;
export function hashGuestTrackingToken(token: string): string;
