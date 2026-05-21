"use client";

import { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getSystemPrompt,
  setSystemPrompt,
  resetSystemPrompt,
  DEFAULT_PROMPT,
} from "@/lib/system-prompt";

interface PerpetualPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PerpetualPrompt({ open, onOpenChange }: PerpetualPromptProps) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(getSystemPrompt());
      setSaved(false);
    }
  }, [open]);

  const handleSave = () => {
    setSystemPrompt(value.trim() || DEFAULT_PROMPT);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleReset = () => {
    resetSystemPrompt();
    setValue(DEFAULT_PROMPT);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogTitle>Perpetual Prompt</DialogTitle>
        <DialogDescription>
          This system prompt is prepended to every conversation. Edit it to
          customize how the assistant behaves.
        </DialogDescription>

        <div className="flex-1 min-h-0 mt-4">
          <textarea
            className="w-full h-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            placeholder="Enter your system prompt..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="size-4" />
            Reset to Default
          </Button>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs text-green-600 dark:text-green-400">
                Saved!
              </span>
            )}
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
