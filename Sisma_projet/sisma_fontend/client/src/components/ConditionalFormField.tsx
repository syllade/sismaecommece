import { useEffect, useState } from "react";
import { FormField } from "@/components/ui/form";

export function ConditionalFormField({ 
  show, 
  children, 
  ...props 
}: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (show) {
      // Petit délai pour éviter les conflits de portail
      const timer = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [show]);

  if (!show || !mounted) return null;

  return <FormField {...props}>{children}</FormField>;
}