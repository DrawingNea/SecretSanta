import React from "react";

export function Alert({
  children,
  variant = "error",
}: {
  children: React.ReactNode;
  variant?: "error" | "ok";
}) {
  return <div className={`alert ${variant === "ok" ? "ok" : ""}`}>{children}</div>;
}
