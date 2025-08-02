// lib/groq.ts
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function askGroq(prompt: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Groq API key is not defined in .env.local");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-8b-8192", // Bisa juga coba "mixtral-8x7b-32768"
      messages: [
  {
    role: "system",
    content: "You are a helpful fashion assistant. Always respond in the same language as the user prompt.",
  },
  {
    role: "user",
    content: prompt,
  },
],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
