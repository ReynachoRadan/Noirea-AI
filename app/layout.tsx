import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI Chat App",
  description: "Chat powered by Groq API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} min-h-screen bg-black text-white overflow-hidden`}>
        <div className="flex flex-col h-full w-full overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
