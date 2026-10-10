import { BUILD_VERSION } from "@/generated/build-version";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  return Response.json(
    { version: BUILD_VERSION },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
