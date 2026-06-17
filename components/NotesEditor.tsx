"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { useUpdateNotes } from "@/hooks/useCandidates";

interface NotesEditorProps {
  candidateId: Id<"candidates">;
  initialNotes?: string;
}

export function NotesEditor({ candidateId, initialNotes = "" }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const updateNotes = useUpdateNotes();

  useEffect(() => {
    setNotes(initialNotes);
    setSaved(true);
  }, [initialNotes, candidateId]);

  useEffect(() => {
    setSaved(notes === initialNotes);
  }, [notes, initialNotes]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateNotes({ candidateId, notes });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        placeholder="Add private notes about this candidate…"
        rows={6}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-500">
          {saved ? "Saved" : "Unsaved changes"}
        </p>
        <Button size="sm" onClick={handleSave} disabled={saved || saving}>
          {saving ? "Saving…" : "Save notes"}
        </Button>
      </div>
    </div>
  );
}
