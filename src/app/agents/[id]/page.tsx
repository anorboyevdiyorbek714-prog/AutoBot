import { supabase } from "@/lib/supabase";
import KnowledgeBaseConfig from "@/components/KnowledgeBaseConfig";
import { ChevronLeft, Bot, ExternalLink, Activity, Database } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const { data: bot } = await supabase.from("bots").select("*").eq("id", id).single();
  
  if (!bot) notFound();

  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .eq("bot_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link 
            href="/agents" 
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Agents
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Bot size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agent Configuration</h1>
              <p className="text-muted-foreground text-sm font-mono mt-0.5">ID: {bot.id}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-all">
            <ExternalLink size={18} />
            Test Bot
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <KnowledgeBaseConfig botId={bot.id} existingDocs={docs || []} />
        </div>

        <div className="space-y-6">
          {/* Agent Stats */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-6">
              <Activity size={16} />
              Agent Health
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Knowledge Depth</span>
                <span className="font-bold flex items-center gap-2 underline underline-offset-4 decoration-primary/30">
                  <Database size={14} className="text-primary" />
                  {docs?.length || 0} Docs
                </span>
              </div>
            </div>
          </div>

          {/* Integration Info */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 text-primary opacity-5 -z-0 rotate-12">
              <Bot size={120} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 relative z-10">Webhook Integration</h3>
            <div className="space-y-3 relative z-10">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your bot to the global AI network via our secure gateway.
              </p>
              <div className="bg-background/80 backdrop-blur border border-border rounded-lg p-3 font-mono text-[10px] break-all">
                https://autobot.ai/api/v1/webhook/{bot.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
