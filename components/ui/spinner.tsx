import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Loader2
        className={cn("animate-spin text-muted-foreground", sizeClasses[size])}
      />
    </div>
  );
} 