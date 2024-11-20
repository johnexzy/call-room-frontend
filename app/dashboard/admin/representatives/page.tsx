"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface Representative {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAvailable: boolean;
}

export default function RepresentativesPage() {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadRepresentatives();
  }, []);

  const loadRepresentatives = async () => {
    try {
      const response = await apiClient.get("/admin/representatives");
      if (response.ok) {
        const data = await response.json();
        setRepresentatives(data);
      }
    } catch (error) {
      console.error("Failed to load representatives:", error);
    }
  };

  const handleAvailabilityChange = async (id: string, isAvailable: boolean) => {
    try {
      const response = await apiClient.put(`/admin/representatives/${id}`, {
        isAvailable,
      });

      if (response.ok) {
        setRepresentatives((prev) =>
          prev.map((rep) =>
            rep.id === id ? { ...rep, isAvailable } : rep
          )
        );

        toast({
          title: "Success",
          description: `Representative availability ${
            isAvailable ? "enabled" : "disabled"
          }`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update representative availability",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Representatives</h1>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Availability</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {representatives.map((rep) => (
            <TableRow key={rep.id}>
              <TableCell>
                {rep.firstName} {rep.lastName}
              </TableCell>
              <TableCell>{rep.email}</TableCell>
              <TableCell>
                <Badge
                  variant={rep.isAvailable ? "success" : "secondary"}
                >
                  {rep.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </TableCell>
              <TableCell>
                <Switch
                  checked={rep.isAvailable}
                  onCheckedChange={(checked) =>
                    handleAvailabilityChange(rep.id, checked)
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 