import type { KeyboardEvent, MouseEvent } from "react";
import { Store } from "lucide-react";
import { useLocation } from "wouter";
import {
  getProductShopHref,
  getProductSupplierName,
  type ProductShopCandidate,
} from "@/lib/product-shop";

interface ProductShopLinkProps {
  product: ProductShopCandidate | null | undefined;
  className?: string;
  showIcon?: boolean;
}

export function ProductShopLink({
  product,
  className = "",
  showIcon = false,
}: ProductShopLinkProps) {
  const [, setLocation] = useLocation();
  const href = getProductShopHref(product);
  const shopName = getProductSupplierName(product);

  if (!href || !shopName) {
    return null;
  }

  const navigateToShop = (event: MouseEvent<HTMLSpanElement> | KeyboardEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setLocation(href);
  };

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={navigateToShop}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          navigateToShop(event);
        }
      }}
      className={`inline-flex max-w-full cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-primary focus:outline-none focus:text-primary ${className}`}
    >
      {showIcon && <Store className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{shopName}</span>
    </span>
  );
}
