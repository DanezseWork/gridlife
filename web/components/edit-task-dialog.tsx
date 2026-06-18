"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface EditTaskForm {
  title: string;
  details: string;
}

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle: string;
  initialDetails: string;
  onSave: (form: EditTaskForm) => Promise<void>;
}

export function EditTaskDialog({
  open,
  onOpenChange,
  initialTitle,
  initialDetails,
  onSave,
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [details, setDetails] = useState(initialDetails);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDetails(initialDetails);
    }
  }, [open, initialTitle, initialDetails]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSave({ title: title.trim(), details: details.trim() });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          background: "var(--color-base)",
          color: "var(--color-inverse)",
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-task-title">Title</Label>
            <Input
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-task-details">Details (optional)</Label>
            <Input
              id="edit-task-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Notes or context"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="btn-accent w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-40"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
