import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  SUCCESS_FEEDBACK_EVENT,
  type SuccessFeedbackPayload,
} from "@/hooks/useSuccessFeedback";

const DISPLAY_DURATION_MS = 1350;

export const SuccessCheck = () => {
  const [items, setItems] = useState<SuccessFeedbackPayload[]>([]);

  useEffect(() => {
    const handleSuccess = (event: Event) => {
      const detail = (event as CustomEvent<SuccessFeedbackPayload>).detail;
      if (!detail) return;

      setItems((current) => [...current.slice(-2), detail]);

      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== detail.id));
      }, DISPLAY_DURATION_MS);
    };

    window.addEventListener(SUCCESS_FEEDBACK_EVENT, handleSuccess);
    return () => window.removeEventListener(SUCCESS_FEEDBACK_EVENT, handleSuccess);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[10000]"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {items.map((item) => {
          const isPositioned = typeof item.x === "number" && typeof item.y === "number";

          return (
            <motion.div
              key={item.id}
              className="absolute flex flex-col items-center gap-2"
              style={{
                left: isPositioned ? item.x : "50%",
                top: isPositioned ? item.y : "50%",
                x: "-50%",
                y: "-50%",
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.82 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-full border border-green-200/80 bg-green-100/95 text-green-700 shadow-lg shadow-green-900/10 backdrop-blur-sm"
                initial={{ boxShadow: "0 0 0 0 rgba(34, 197, 94, 0.22)" }}
                animate={{ boxShadow: "0 0 0 14px rgba(34, 197, 94, 0)" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <Check className="h-8 w-8" strokeWidth={3} />
              </motion.div>
              {item.message && (
                <motion.span
                  className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm ring-1 ring-border/70 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, delay: 0.05 }}
                >
                  {item.message}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default SuccessCheck;
