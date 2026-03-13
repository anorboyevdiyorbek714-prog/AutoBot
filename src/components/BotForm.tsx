"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
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
      // 1. Bazaga tokenni saqlash
      const { data, error } = await supabase
        .from("bots")
        .upsert(
          { bot_token: botToken },
          { onConflict: 'bot_token' }
        )
        .select()
        .single();

      if (error) throw error;

      // 2. Avtomatik Webhook ulanishi
      const appUrl = window.location.origin;
      const webhookUrl = `${appUrl}/api/telegram/webhook?bot_token=${botToken}`;
      const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
      const tgData = await tgResponse.json();

      if (!tgData.ok) {
        throw new Error("Telegramga ulanishda xato: " + tgData.description);
      }

      setMessage("Muvaffaqiyatli ulandi! Agent paneliga o'tilmoqda...");
      
      // 3. Yangi aqlli panelga olib o'tish
      setTimeout(() => {
        router.push(`/agents/${data.id}`);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setMessage("Xato: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">AI Agent Yaratish</h2>
      
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Telegram Bot Token
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjkl..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center text-white font-medium transition-all ${
            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
          }`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Botni Ulash va Davom Etish"}
        </button>

        {message && (
          <div className={`p-4 rounded-lg text-sm font-medium text-center ${message.includes("Xato") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}