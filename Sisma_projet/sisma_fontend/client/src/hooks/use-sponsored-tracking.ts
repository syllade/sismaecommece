import { useEffect, useRef } from "react";
import { recordClick, recordImpression } from "@/hooks/use-sponsored";

export function useSponsoredImpression(campaignId?: number, productId?: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const hasRecorded = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasRecorded.current) return;
    if (!campaignId && !productId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !entry.isIntersecting || hasRecorded.current) return;
        hasRecorded.current = true;
        recordImpression(campaignId, productId);
        observer.disconnect();
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [campaignId, productId]);

  return ref;
}

export function trackSponsoredClick(campaignId?: number, productId?: number) {
  if (!campaignId && !productId) return;
  recordClick(campaignId, productId);
}
