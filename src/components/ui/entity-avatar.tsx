import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface EntityAvatarProps {
  name: string;
  logo?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function EntityAvatar({ name, logo, className, fallbackClassName }: EntityAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <Avatar className={cn("rounded-lg", className)}>
      {logo ? <AvatarImage src={logo} alt={name} className="rounded-lg object-cover" /> : null}
      <AvatarFallback className={cn("rounded-lg", fallbackClassName)}>{initial}</AvatarFallback>
    </Avatar>
  );
}
