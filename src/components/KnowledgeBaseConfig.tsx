"use client";

import { useState, useCallback } from "react";
import { 
  FileText, 
  Upload, 
  Type, 
  ChevronRight, 
  Save, 
  Loader2, 
  Trash2,
  File,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KnowledgeBaseConfigProps {
  botId: string;
  existingDocs: any[];
}

export default function KnowledgeBaseConfig({ botId, existingDocs: initialDocs }: KnowledgeBaseConfigProps) {
  const [textInput, setTextInput] = useState("");
  const [isSavingText, setIsSavingText] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [docs, setDocs] = useState(initialDocs);
  const [error, setError] = useState<string | null>(null);

  const handleSaveText = async () => {
    if (!textInput.trim()) return;
    setIsSavingText(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("text", textInput);
      formData.append("botId", botId);

      const res = await fetch("/api/knowledge/add", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save knowledge");
      
      const newDoc = await res.json();
      setDocs([newDoc, ...docs]);
      setTextInput("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingText(false);
    }
  };

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("botId", botId);

      const res = await fetch("/api/knowledge/add", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload file");

      const newDoc = await res.json();
      setDocs([newDoc, ...docs]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 delay-150">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Raw Text Input */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Type size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Raw Text Knowledge</h3>
            <p className="text-xs text-muted-foreground">Add specific instructions or facts manually.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter knowledge here..."
              maxLength={2000}
              className="w-full min-h-[160px] rounded-xl bg-background border border-border p-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-muted-foreground/40"
            />
            <div className="absolute bottom-4 right-4 text-[10px] font-medium text-muted-foreground/60 bg-background/50 backdrop-blur px-2 py-1 rounded-md border border-border">
              {textInput.length} / 2000
            </div>
          </div>
          <button
            onClick={handleSaveText}
            disabled={isSavingText || !textInput.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {isSavingText ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Text Knowledge
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Upload size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Document Library</h3>
            <p className="text-xs text-muted-foreground">Upload PDFs, DOCX, or TXT files for RAG processing.</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-border rounded-xl p-8 transition-colors hover:border-primary/50 group">
          <label className="flex flex-col items-center justify-center cursor-pointer space-y-3">
            <div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
              <FileText size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <span className="text-sm font-semibold block">Click to upload or drag and drop</span>
              <span className="text-[10px] text-muted-foreground">PDF, DOCX, or TXT (Max 10MB)</span>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.docx,.txt"
              onChange={onFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>

        {isUploading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-primary font-medium animate-pulse">
            <Loader2 className="animate-spin" size={16} />
            Processing and embedding document...
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Current Documents</h4>
        <div className="grid gap-3">
          {docs.map((doc) => (
            <div 
              key={doc.id}
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border group hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                  <File size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">{doc.name}</div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{doc.type.toUpperCase()}</span>
                    <span>•</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <button className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all opacity-0 group-hover:opacity-100">
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {docs.length === 0 && (
            <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card/50">
              <p className="text-sm text-muted-foreground italic">No documents uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
