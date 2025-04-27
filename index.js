require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`SyncGPT (Gemini Edition) is online as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!ask")) {
    if (message.author.bot) return;
    message.reply("Write prompts starting with !ask");
  }

  const fullInput = message.content.slice(4).trim();
  const maxLength = 2000;

  if (fullInput.length > maxLength) {
    message.reply(
      `Your question is too long. It will be shortened to ${maxLength} characters.`
    );
  }

  const userInput = fullInput.slice(0, maxLength);

  if (!userInput) {
    return message.reply("Please ask a question after `!ask`.");
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: userInput }],
          },
        ],
      }
    );

    const reply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Gemini did not return a reply.";

    // 🛠️ New addition: Split reply if too long
    if (reply.length > maxLength) {
      const chunks = reply.match(/[\s\S]{1,2000}/g) || [];
      for (const chunk of chunks) {
        await message.reply(chunk);
      }
    } else {
      await message.reply(reply);
    }
  } catch (error) {
    console.error(
      "Error from Gemini API:",
      error.response?.data || error.message
    );
    await message.reply("Sorry, something went wrong with Gemini AI.");
  }
});

client.login(process.env.BOT_TOKEN);
