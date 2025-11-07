import React from "react";

export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="shell">{children}</div>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}
