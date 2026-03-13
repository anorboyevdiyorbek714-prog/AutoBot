/**
 * usage: node scripts/set-webhook.js <BOT_TOKEN> <FUNCTION_URL>
 */

const botToken = process.argv[2];
const functionUrl = process.argv[3];

if (!botToken || !functionUrl) {
  console.error("Missing arguments! \nUsage: node set-webhook.js <BOT_TOKEN> <WEBHOOK_URL>");
  process.exit(1);
}

async function setWebhook() {
  const webhookUrl = `${functionUrl}?bot_token=${botToken}`;
  const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.ok) {
      console.log("✅ Webhook successfully set!");
      console.log(data);
    } else {
      console.error("❌ Failed to set webhook.");
      console.error(data);
    }
  } catch (error) {
    console.error("❌ Network error:", error);
  }
}

setWebhook();
