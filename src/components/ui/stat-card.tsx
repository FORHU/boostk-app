import type * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  caption?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, icon, caption, className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {icon}
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {caption ? <p className="mt-1 text-xs font-medium text-muted-foreground">{caption}</p> : null}
      </div>
    </div>
  );
}
