"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectBasedOnRole = async () => {
      try {
        const response = await apiClient.get("/users/profile");
        if (response.ok) {
          const user = await response.json();
          console.log("user", user);
          if (user.role === "admin") {
            router.push("/dashboard/admin");
          } else if (user.role === "representative") {
            router.push("/dashboard/representative");
          } else {
            router.push("/dashboard/customer");
          }
        } else {
          // If there's an error fetching the profile, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        router.push("/login");
      }
    };

    redirectBasedOnRole();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
} 