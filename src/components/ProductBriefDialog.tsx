import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Save, Plus, X, Upload, File, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MaterialSpecFile {
  name: string;
  size: number;
  dataUrl: string;
}

interface ProductBrief {
  materialSpec: string;
  materialSpecFiles: MaterialSpecFile[];
  constraints: string;
  priorities: string[];
  customPriorities: string[];
  status: string;
  notes: string;
}

interface ProductBriefDialogProps {
  isOpen: boolean;
  onClose: () => void;
  topicKey: string;
  productName: string;
}

const PRIORITY_OPTIONS = [
  'Decarbonization',
  'Supply Diversification',
  'Cost Reduction',
  'Circular Economy',
  'Bio-based Transition',
  'Regulatory Compliance',
  'Performance Improvement',
  'Waste Valorisation',
];

const STATUS_OPTIONS = [
  'Scoping',
  'Under Review',
  'Active Evaluation',
  'Pilot Planning',
  'On Hold',
  'Completed',
];

const emptyBrief: ProductBrief = {
  materialSpec: '',
  materialSpecFiles: [],
  constraints: '',
  priorities: [],
  customPriorities: [],
  status: 'Scoping',
  notes: '',
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ProductBriefDialog: React.FC<ProductBriefDialogProps> = ({ isOpen, onClose, topicKey, productName }) => {
  const storageKey = `product-brief-${topicKey}`;
  const [brief, setBrief] = useState<ProductBrief>(emptyBrief);
  const [newPriority, setNewPriority] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBrief({ ...emptyBrief, ...parsed, customPriorities: parsed.customPriorities || [], materialSpecFiles: parsed.materialSpecFiles || [] });
      } catch { /* ignore */ }
    } else {
      setBrief(emptyBrief);
    }
  }, [storageKey, isOpen]);

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(brief));
    toast.success('Material brief saved');
    onClose();
  };

  const togglePriority = (p: string) => {
    setBrief(prev => ({
      ...prev,
      priorities: prev.priorities.includes(p)
        ? prev.priorities.filter(x => x !== p)
        : [...prev.priorities, p],
    }));
  };

  const addCustomPriority = () => {
    const trimmed = newPriority.trim();
    if (!trimmed) return;
    if (brief.customPriorities.includes(trimmed) || PRIORITY_OPTIONS.includes(trimmed)) return;
    setBrief(prev => ({
      ...prev,
      customPriorities: [...prev.customPriorities, trimmed],
      priorities: [...prev.priorities, trimmed],
    }));
    setNewPriority('');
  };

  const removeCustomPriority = (p: string) => {
    setBrief(prev => ({
      ...prev,
      customPriorities: prev.customPriorities.filter(x => x !== p),
      priorities: prev.priorities.filter(x => x !== p),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile: MaterialSpecFile = {
          name: file.name,
          size: file.size,
          dataUrl: reader.result as string,
        };
        setBrief(prev => ({
          ...prev,
          materialSpecFiles: [...prev.materialSpecFiles, newFile],
        }));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setBrief(prev => ({
      ...prev,
      materialSpecFiles: prev.materialSpecFiles.filter((_, i) => i !== index),
    }));
  };

  const allPriorities = [...PRIORITY_OPTIONS, ...brief.customPriorities];

  return (
    <Dialog open={isOpen} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto p-3.5">
        <DialogHeader className="pb-0.5">
          <DialogTitle className="flex items-center gap-1.5 text-[11px] font-semibold">
            <FileText className="w-3 h-3 text-primary" />
            Material Brief — {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5 pt-0.5">
          {/* Status */}
          <div className="space-y-0.5">
            <Label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Status</Label>
            <Select value={brief.status} onValueChange={v => setBrief(prev => ({ ...prev, status: v }))}>
              <SelectTrigger className="text-[11px] h-7">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s} className="text-[11px]">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Material Spec - File Upload */}
          <div className="space-y-1">
            <Label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Material Specification</Label>
            
            {/* Uploaded files list */}
            {brief.materialSpecFiles.length > 0 && (
              <div className="space-y-1">
                {brief.materialSpecFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 border border-border rounded-md px-2 py-1.5 bg-muted/30">
                    <File className="w-3 h-3 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-[8px] text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <button onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1.5 w-full border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3 h-3" />
              Upload Document
            </Button>
          </div>

          {/* Constraints */}
          <div className="space-y-0.5">
            <Label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Constraints</Label>
            <Textarea
              placeholder="e.g. Cost ceiling $1,200/ton, replace by 2029, heat resistance >180°C, EU REACH compliant..."
              value={brief.constraints}
              onChange={e => setBrief(prev => ({ ...prev, constraints: e.target.value }))}
              className="text-[11px] min-h-[40px] py-1.5"
            />
          </div>

          {/* Internal Priorities */}
          <div className="space-y-0.5">
            <Label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Internal Priorities</Label>
            <div className="flex flex-wrap gap-1">
              {allPriorities.map(p => {
                const isCustom = brief.customPriorities.includes(p);
                return (
                  <Badge
                    key={p}
                    variant={brief.priorities.includes(p) ? 'default' : 'outline'}
                    className={`cursor-pointer text-[8px] px-1.5 py-0 h-5 transition-all ${
                      brief.priorities.includes(p)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => togglePriority(p)}
                  >
                    {p}
                    {isCustom && (
                      <X
                        className="w-2.5 h-2.5 ml-0.5 opacity-60 hover:opacity-100"
                        onClick={e => { e.stopPropagation(); removeCustomPriority(p); }}
                      />
                    )}
                  </Badge>
                );
              })}
              {!showOtherInput ? (
                <Badge
                  variant="outline"
                  className="cursor-pointer text-[8px] px-1.5 py-0 h-5 hover:bg-muted border-dashed"
                  onClick={() => setShowOtherInput(true)}
                >
                  + Other
                </Badge>
              ) : (
                <div className="flex items-center gap-0.5">
                  <Input
                    autoFocus
                    placeholder="Type priority..."
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { addCustomPriority(); setShowOtherInput(false); }
                      if (e.key === 'Escape') { setNewPriority(''); setShowOtherInput(false); }
                    }}
                    className="!text-[8px] h-5 w-24 px-1.5 py-0"
                  />
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => { addCustomPriority(); setShowOtherInput(false); }}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-0.5">
            <Label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Notes</Label>
            <Textarea
              placeholder="Any additional context, references, or considerations..."
              value={brief.notes}
              onChange={e => setBrief(prev => ({ ...prev, notes: e.target.value }))}
              className="text-[11px] min-h-[36px] py-1.5"
            />
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <Button size="sm" className="h-6 text-[10px] gap-1 px-2.5" onClick={handleSave}>
              <Save className="w-2.5 h-2.5" />
              Save Brief
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductBriefDialog;
