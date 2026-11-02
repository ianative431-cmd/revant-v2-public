export function createSecurityHeaders(supabaseOrigin?: string): Array<{
  source: string;
  headers: Array<{ key: string; value: string }>;
}>;
