import BotForm from "@/components/BotForm";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden">
      {/* Background blobs for aesthetic */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full blur-[128px] -z-10" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] -z-10" />

      <div className="w-full max-w-4xl space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 mb-2">
            <Sparkles size={14} />
            AutoBot Dashboard
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Teach your <span className="text-primary italic">AI Bot</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Easily manage your Telegram bot's knowledge base and token from a single, secure dashboard.
          </p>
        </div>

        <BotForm />
      </div>

      <footer className="mt-24 text-muted-foreground/40 text-sm">
        &copy; {new Date().getFullYear()} AutoBot Platform. Powered by Supabase.
      </footer>
    </main>
  );
}
