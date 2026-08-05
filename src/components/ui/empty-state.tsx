import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  size?: "default" | "sm"
  className?: string
}

export function EmptyState({ icon, title, description, action, size = "default", className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center text-muted-foreground",
        size === "default" && "py-12",
        size === "sm" && "py-4",
        className,
      )}
    >
      {icon && <div className="mb-3">{icon}</div>}
      <h3 className={cn("font-medium", size === "default" && "text-lg", size === "sm" && "text-sm")}>{title}</h3>
      {description && <p className="text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
