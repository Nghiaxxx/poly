"use client";
import { usePathname } from "next/navigation";
import React from "react";

export default function BodyBackground({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <body style={{ background: isHome ? "#fff" : undefined }}>
      {children}
    </body>
  );
}
