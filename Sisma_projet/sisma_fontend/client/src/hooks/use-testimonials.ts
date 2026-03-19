import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, getApiHeaders } from "@/lib/apiConfig";

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const url = buildApiUrl('/testimonials');
      const res = await fetch(url, { headers: getApiHeaders() });
      if (!res.ok) throw new Error("Failed to fetch testimonials");
      return res.json();
    },
  });
}

