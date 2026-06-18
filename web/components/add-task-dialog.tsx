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

export interface NewTaskForm {
  title: string;
  details: string;
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (form: NewTaskForm) => Promise<void>;
}

export function AddTaskDialog({
  open,
  onOpenChange,
  onCreate,
}: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDetails("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onCreate({ title: title.trim(), details: details.trim() });
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
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-details">Details (optional)</Label>
            <Input
              id="task-details"
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
            {submitting ? "Adding…" : "Add task"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
