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

  it("normalizes clothing category synonyms", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      "VALID: yes\nCONFIDENCE: high\nNAME: Blue jeans\nCATEGORY: pants\nCOLOR: blue",
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      category: "bottom",
    });
  });

  it("classifies footwear synonyms as shoes", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      "VALID: yes\nCONFIDENCE: high\nNAME: White sneakers\nCATEGORY: footwear\nCOLOR: white",
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ category: "shoes" });
  });

  it("returns only the color value", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      "VALID: yes\nCONFIDENCE: high\nNAME: White sneakers\nCATEGORY: shoes\nCOLOR: dominant color is white",
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ color: "white" });
  });

  it("extracts the item name from descriptive labels", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      "VALID: yes\nCONFIDENCE: high\nPRODUCT NAME: Black running shoes\nCATEGORY: footwear\nCOLOR: primary color is black",
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      name: "Black running shoes",
      category: "shoes",
      color: "black",
    });
  });

  it("removes sentence prefixes from the item name", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      "NAME: It's a white sneaker\nCATEGORY: shoes\nCOLOR: white",
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      name: "white sneaker",
      category: "shoes",
      color: "white",
    });
  });

  it("removes prompt placeholders and supporting color words", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      "NAME: [specific short item name]\nCATEGORY: shoes\nCOLOR: a deep blue",
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      name: "",
      category: "shoes",
      color: "blue",
    });
  });

  it("removes the item-is prefix from the item name", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      "NAME: item is a loafer\nCATEGORY: shoes\nCOLOR: brown",
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      name: "loafer",
      category: "shoes",
      color: "brown",
    });
  });

  it("keeps a usable category when the model is uncertain", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      "VALID: no\nCONFIDENCE: low\nNAME: Unknown\nCATEGORY: top\nCOLOR: unknown",
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      name: "Unknown",
      category: "top",
      color: "unknown",
    });
  });

  it("parses labels after a model preamble", async () => {
    groq.callGroqVisionStructured.mockResolvedValue(
      "I inspected the image. NAME is White shirt; CATEGORY is shirt; COLOUR is white.",
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      name: "White shirt",
      category: "top",
      color: "white",
    });
  });
});
