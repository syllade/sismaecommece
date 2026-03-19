import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface ProductCardSkeletonProps {
  index?: number;
}

/** Skeleton d'une carte produit pour chargement fluide */
export function ProductCardSkeleton({ index = 0 }: ProductCardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm flex flex-col"
    >
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 flex flex-col gap-2">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-4/5 rounded" />
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-2.5 w-2.5 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-4 w-16 mt-1 rounded" />
        <Skeleton className="h-9 w-full mt-2 rounded-xl" />
      </div>
    </motion.div>
  );
}
