import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { SendHorizonal } from "lucide-react";

export function Button({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "p-2 rounded-xl border-2 border-neutral-400 bg-white text-neutral-800",
        "hover:border-white hover:bg-neutral-900 hover:text-white",
        "disabled:opacity-50 transition duration-300",
        className
      )}
    >
      {children || <SendHorizonal className="w-5 h-5" />}
    </button>
  );
}
