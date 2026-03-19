import { motion } from "framer-motion";

interface LoaderProps {
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Full screen loader */
  fullScreen?: boolean;
  /** Custom text to display below spinner */
  text?: string;
  /** Custom className */
  className?: string;
}

// SISMA Colors
const S = {
  red: "#D81918",
  orange: "#F7941D",
};

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
};

const borderSizes = {
  sm: "border-2",
  md: "border-3",
  lg: "border-4",
  xl: "border-[6px]",
};

export function Loader({
  size = "md",
  fullScreen = false,
  text,
  className = "",
}: LoaderProps) {
  const spinner = (
    <motion.div
      className={`${sizeClasses[size]} ${borderSizes[size]} rounded-full border-t-transparent border-red-600`}
      style={{
        borderTopColor: "transparent",
        borderColor: S.red,
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {spinner}
      {text && (
        <p className="text-gray-500 text-sm animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

// Skeleton loader for content placeholders
interface SkeletonProps {
  /** Number of skeleton items */
  count?: number;
  /** Custom className */
  className?: string;
  /** Height of each skeleton */
  height?: string;
  /** Width of each skeleton */
  width?: string;
}

export function Skeleton({ count = 1, className = "", height = "h-4", width }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gray-200 rounded-lg animate-pulse ${width || "w-full"}`}
        />
      ))}
    </div>
  );
}

// Page loader with SISMA branding
export function PageLoader({ text = "Chargement..." }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <motion.div
        className="w-16 h-16 rounded-full border-4 border-t-transparent"
        style={{ borderColor: S.red }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `linear-gradient(135deg, ${S.red}, ${S.orange})`,
            opacity: 0.2,
          }}
        />
      </motion.div>
      <p className="mt-4 text-gray-600 font-medium">{text}</p>
    </div>
  );
}

export default Loader;
