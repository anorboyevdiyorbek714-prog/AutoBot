import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Bot, Plus, Trash2, ArrowRight } from "lucide-react";

export default async function AgentsPage() {
  const { data: bots } = await supabase.from("bots").select("*").order("created_at", { ascending: false });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground mt-1">Manage and train your fleet of AI assistants.</p>
        </div>
        <Link 
          href="/"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          Create New Agent
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {bots?.map((bot) => (
          <div 
            key={bot.id}
            className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Bot size={24} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-foreground mb-1">Bot #{bot.id.slice(0, 8)}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mb-4 font-mono">
              {bot.bot_token.slice(0, 10)}...
            </p>

            <Link 
              href={`/agents/${bot.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Configure Knowledge
              <ArrowRight size={16} />
            </Link>
          </div>
        ))}

        {(!bots || bots.length === 0) && (
          <div className="col-span-full rounded-2xl border border-dashed border-border py-20 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Bot size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No agents found</h3>
            <p className="text-muted-foreground">Create your first AI agent to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
