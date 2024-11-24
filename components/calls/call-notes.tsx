"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  content: string;
  timestamp: Date;
  category: string;
  isAIGenerated: boolean;
}

interface CallNotesProps {
  callId: string;
  isActive: boolean;
}

export function CallNotes({ callId, isActive }: CallNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [callId]);

  const loadNotes = async () => {
    try {
      const response = await apiClient.get(`/calls/${callId}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await apiClient.post(`/calls/${callId}/notes`, {
        content: newNote,
      });

      if (response.ok) {
        const data = await response.json();
        setNotes([...notes, data]);
        setNewNote('');
        toast({
          title: "Note Added",
          description: "Your note has been saved successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActive && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <Button onClick={addNote} className="w-full">
              Add Note
            </Button>
          </div>
        )}

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-muted rounded-lg space-y-2"
            >
              <div className="flex justify-between items-start">
                <p className="text-sm">{note.content}</p>
                <Badge variant={note.isAIGenerated ? "default" : "secondary"}>
                  {note.isAIGenerated ? "AI Generated" : "Manual"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(note.timestamp).toLocaleString()}
              </p>
            </div>
          ))}

          {notes.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No notes yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 