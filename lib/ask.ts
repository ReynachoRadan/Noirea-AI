import { Message } from "@/types";

export async function askAI(messages: Message[]): Promise<string> {
  // Sementara dummy response
  const lastMessage = messages[messages.length - 1];
  return `You asked: "${lastMessage.text}". Here's a fashion tip: Always wear confidence.`;
}
