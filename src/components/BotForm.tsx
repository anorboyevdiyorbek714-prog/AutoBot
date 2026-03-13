"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, Key } from "lucide-react";

export default function BotForm() {
  const [botToken, setBotToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSave = async () => {
    if (!botToken.includes(":")) {
      setMessage("Iltimos, to'g'ri bot tokenini kiriting.");
      return;
    }
    setLoading(true);
    setMessage("Bot ulanmoqda...");
    
    try {
      const res = await fetch("/api/bot/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ botToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ulanishda xato yuz berdi");
      }

      setMessage("Muvaffaqiyatli ulandi! Agent paneliga o'tilmoqda...");
      
      setTimeout(() => {
        router.push(`/agents/${data.botId}`);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setMessage("Xato: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-card rounded-2xl shadow-xl border border-border">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
          <Bot className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-6 text-center text-foreground">AI Agent Yaratish</h2>
      
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Telegram Bot Token
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjkl..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`w-full py-4 px-4 rounded-xl flex items-center justify-center text-primary-foreground font-semibold transition-all shadow-lg shadow-primary/10 ${
            loading ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:opacity-90 active:scale-[0.98]"
          }`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Botni Ulash va Davom Etish"}
        </button>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium text-center border animate-in fade-in duration-300 ${
            message.includes("Xato") 
              ? "bg-destructive/10 text-destructive border-destructive/20" 
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}