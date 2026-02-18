import { handlers } from "@/auth";

async function handleAuth(
  req: Request,
  handler: (req: Request) => Promise<Response>
) {
  try {
    return await handler(req);
  } catch (e) {
    console.error("[auth][error]", e);
    return new Response(
      JSON.stringify({
        error: "AuthError",
        message: e instanceof Error ? e.message : "Server configuration error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET(req: Request) {
  return handleAuth(req, handlers.GET);
}

export async function POST(req: Request) {
  return handleAuth(req, handlers.POST);
}
