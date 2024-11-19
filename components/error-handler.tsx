"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ErrorHandlerProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorHandler({ error, reset }: ErrorHandlerProps) {
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "An error occurred",
      description: error.message,
      variant: "destructive",
    });
  }, [error, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
        >
          Try again
        </button>
      </div>
    </div>
  );
} 