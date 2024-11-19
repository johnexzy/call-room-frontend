"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export function StarRating({ value, onChange, max = 5 }: StarRatingProps) {
  return (
    <div className="flex space-x-1">
      {Array.from({ length: max }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onChange(index + 1)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              "w-6 h-6 transition-colors",
              index < value
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
} 