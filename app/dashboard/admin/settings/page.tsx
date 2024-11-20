"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

interface SystemSettings {
  maxQueueSize: number;
  maxWaitTime: number;
  enableCallbacks: boolean;
  enableAutoAssignment: boolean;
  workingHours: {
    start: string;
    end: string;
  };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    maxQueueSize: 50,
    maxWaitTime: 30,
    enableCallbacks: true,
    enableAutoAssignment: true,
    workingHours: {
      start: "09:00",
      end: "17:00",
    },
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.put("/admin/settings", settings);
      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Queue Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxQueueSize">Maximum Queue Size</Label>
              <Input
                id="maxQueueSize"
                type="number"
                value={settings.maxQueueSize}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxQueueSize: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxWaitTime">Maximum Wait Time (minutes)</Label>
              <Input
                id="maxWaitTime"
                type="number"
                value={settings.maxWaitTime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxWaitTime: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enableCallbacks">Enable Callbacks</Label>
              <Switch
                id="enableCallbacks"
                checked={settings.enableCallbacks}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableCallbacks: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enableAutoAssignment">
                Enable Auto Assignment
              </Label>
              <Switch
                id="enableAutoAssignment"
                checked={settings.enableAutoAssignment}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableAutoAssignment: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={settings.workingHours.start}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      workingHours: {
                        ...settings.workingHours,
                        start: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={settings.workingHours.end}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      workingHours: {
                        ...settings.workingHours,
                        end: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Save Settings
        </Button>
      </form>
    </div>
  );
} 