"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bot, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BotForm() {
  const [botToken, setBotToken] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('bots')
        .insert([{ bot_token: botToken, knowledge_base: knowledgeBase }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Bot configuration saved successfully!' });
      setBotToken('');
      setKnowledgeBase('');
    } catch (err: any) {
      console.error('Error saving bot:', err);
      setMessage({ type: 'error', text: err.message || 'An error occurred while saving.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 rounded-2xl bg-card border border-border shadow-2xl backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Bot size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bot Configuration</h2>
          <p className="text-muted-foreground text-sm">Set up your AI bot's identity and knowledge.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="token" className="text-sm font-medium text-muted-foreground ml-1">
            Telegram Bot Token
          </label>
          <input
            id="token"
            type="text"
            required
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="123456789:ABCDefGhIJKlmNoPQRstuVwxyZ"
            className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="knowledge" className="text-sm font-medium text-muted-foreground ml-1">
            Knowledge Base
          </label>
          <textarea
            id="knowledge"
            required
            rows={6}
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            placeholder="Describe what your AI should know..."
            className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 transition-all text-foreground resize-none placeholder:text-muted-foreground/50"
          />
        </div>

        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-xl text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
