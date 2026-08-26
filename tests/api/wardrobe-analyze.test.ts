import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
}));
const groq = vi.hoisted(() => ({
  callGroqVisionStructured: vi.fn(),
}));

vi.mock("@/lib/auth/get-user", () => auth);
vi.mock("@/lib/groq-server", () => groq);

import { POST } from "@/app/api/wardrobe/analyze/route";

const unauthorizedResponse = NextResponse.json(
  { error: "Unauthorized" },
  { status: 401 },
);
const imageDataUrl = "data:image/png;base64,ZmFrZQ==";

function request() {
  return new NextRequest("http://localhost", {
    method: "POST",
    body: JSON.stringify({ imageDataUrl }),
    headers: { "Content-Type": "application/json" },
  });
}

describe("wardrobe image analysis", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getAuthenticatedUser.mockReturnValue({
      user: { id: "user-a" },
      errorResponse: unauthorizedResponse,
    });
  });

  it("parses vision output with reasoning and markdown labels", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      "<think>Checking the clothing type.</think>\n**NAME:** White shirt\n**CATEGORY:** top\n**COLOR:** white",
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      name: "White shirt",
      category: "top",
      color: "white",
    });
  });

  it("falls back to labeled fields when a JSON wrapper is malformed", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      '{"name":"White shirt",\nNAME: White shirt\nCATEGORY: top\nCOLOR: white',
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      name: "White shirt",
      category: "top",
      color: "white",
    });
  });

  it("parses an array response with alternative JSON keys", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      '[{"item_name":"Black jacket","type":"outerwear","dominant_color":"black"}]',
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      name: "Black jacket",
      category: "outerwear",
      color: "black",
    });
  });

  it("parses natural-language field descriptions", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      "The item name is Blue jeans. The category is bottom. The dominant color is blue.",
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      name: "Blue jeans",
      category: "bottom",
      color: "blue",
    });
  });
});
