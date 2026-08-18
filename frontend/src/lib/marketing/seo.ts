import type { Metadata } from "next";
import { appUrl } from "@/lib/app-url";

export function marketingMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `${appUrl()}${path}`,
    },
  };
}
