"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function AnimatedWrapped({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          ease: [0.42, 0, 0.58, 1], // ← Ganti string jadi cubic bezier array
        },
      }}
      exit={{
        opacity: 0,
        y: 20,
        transition: {
          duration: 0.3,
          ease: [0.42, 0, 0.58, 1], // ← Sama di sini
        },
      }}
    >
      {children}
    </motion.div>
  );
}
