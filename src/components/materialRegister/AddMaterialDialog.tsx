import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SingleMaterialForm from "@/components/materialRegister/SingleMaterialForm";
import CsvUploadPanel from "@/components/materialRegister/CsvUploadPanel";

const TABS = [
  { id: "single", label: "Single material" },
  { id: "upload", label: "Upload file" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddMaterialDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const [tab, setTab] = useState<TabId>("single");
  const [note, setNote] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setNote(null);
        onOpenChange(v);
      }}
    >
      <DialogContent className="portfolio-type max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">Add material</DialogTitle>
          <DialogDescription className="text-[11px]">
            One material at a time, or a file of them.
          </DialogDescription>
        </DialogHeader>

        <div className="inline-flex items-center gap-1 self-start rounded-md bg-muted p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-[4px] px-2.5 py-1 text-[11px] font-medium transition-colors",
                tab === t.id
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {note && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2 py-1.5 text-[11px] text-emerald-800">
            {note}
          </div>
        )}

        {tab === "single" ? (
          <SingleMaterialForm
            onDone={(savedName, again) => {
              if (again) setNote(`${savedName} added to the register. Form cleared for the next one.`);
              else onOpenChange(false);
            }}
          />
        ) : (
          <CsvUploadPanel onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddMaterialDialog;
