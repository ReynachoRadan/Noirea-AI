export type Message = {
  type: "user" | "ai";
  text: string;
};

export type ChatSession = {
  id: string;
  name: string;
  messages: Message[];
};
