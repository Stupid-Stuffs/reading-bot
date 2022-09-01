require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// connect DB
const db = require("./DB");

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  let r = /^Read\s\"\D+\"\sin\s[0-3][0-9]\sdays/;
  if (message.content.match(r)) {
    await message.reply("Pong!");
  }
});

client.login(process.env.TOKEN);
