export type Message = {
  id?: string;
  type: "user" | "ai";
  text: string;
};

export type ChatSession = {
  id: string;
  name: string;
  messages: Message[];
};