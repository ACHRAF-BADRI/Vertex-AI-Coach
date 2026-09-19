import { AnimatePresence, motion } from "framer-motion";
import { Dumbbell, X } from "lucide-react";
import { useEffect, useState } from "react";

export function ExerciseThumbnail({
  src,
  alt,
  onClick,
}: {
  src?: string | null;
  alt: string;
  onClick?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600">
        <Dumbbell size={20} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white transition-transform hover:scale-105 dark:border-gray-800 dark:bg-gray-900"
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </button>
  );
}

export function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[85vh] max-w-[90vw]"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute -right-3 -top-3 grid h-8 w-8 place-items-center rounded-full bg-white text-gray-700 shadow-lg transition-colors hover:text-gray-900 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <X size={16} />
          </button>
          <img src={src} alt={alt} className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
