import { NextRequest, NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const customKey = req.headers.get("x-gemini-api-key");
  const configured = isGeminiConfigured(customKey);

  return NextResponse.json({
    configured,
    source: customKey ? "custom_client_key" : configured ? "env_variable" : "offline_expert_engine",
  });
}
