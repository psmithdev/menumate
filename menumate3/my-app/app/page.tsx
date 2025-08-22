"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function MenuTranslatorDesign() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the welcome page using Next.js app router
    router.push("/welcome");
  }, [router]);

  return null; // This component just redirects
}
