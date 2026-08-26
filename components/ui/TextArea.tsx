// components/ui/TextArea.tsx
import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils"; // asumsi kamu pakai tailwind merge/classnames helper

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      rows={1}
      className={cn(
        "resize-none overflow-hidden w-full bg-white text-neutral-800 border-2 border-neutral-400 rounded-xl px-4 py-2",
        "hover:bg-black hover:text-white hover:border-white",
        "focus:bg-black focus:text-white focus:border-white",
        "transition duration-300",
        className
      )}
      {...props}
    />
  );
});

TextArea.displayName = "TextArea";
