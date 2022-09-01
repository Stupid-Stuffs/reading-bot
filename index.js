require("dotenv").config();
var CronJob = require("cron").CronJob;

const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

// connect DB
const db = require("./DB");

var job = new CronJob(
  "0 22 * * * *",
  async function () {
    const not_finished_books = await db.query(
      `SELECT * 
		  FROM books
		  WHERE is_finished = false`
    );
    console.log(not_finished_books);
  },
  null,
  false,
  "Asia/Ho_Chi_Minh"
);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  job.start();
});

client.on("messageCreate", async (message) => {
  console.log(message);
  let r = /^Read\s\"(\D+)\"\sin\s([0-3][0-9])\sdays/;
  let m = "";
  if ((m = message.content.match(r))) {
    const book_title = m[1];
    const num_of_days = Number(m[2]);
    const new_date = new Date();
    const finish_at = new Date(
      new_date.setDate(new_date.getDate() + num_of_days)
    );
  }
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(process.env.TOKEN);
