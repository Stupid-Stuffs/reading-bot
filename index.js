require("dotenv").config();
var CronJob = require("cron").CronJob;
const {
  createAudioPlayer,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  AudioPlayerStatus,
  createAudioResource,
} = require("@discordjs/voice");

const fs = require("node:fs");
const path = require("node:path");
const {
  bold,
  userMention,
  Client,
  GatewayIntentBits,
  Collection,
  InteractionType,
  ButtonStyle,
} = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  client.commands.set(command.data.name, command);
}

const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Play,
  },
});

player.on(AudioPlayerStatus.Playing, () => {
  console.log("The audio player has started playing!");
});
const rain_resource = createAudioResource("./sounds/rain.mp3");

// connect DB
const db = require("./DB");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("@discordjs/builders");

const channels = new Set();

var job = new CronJob(
  "0 22 * * * *",
  async function () {
    const { rows } = await db.query(
      `SELECT * 
		  FROM books, users
		  WHERE is_finished = false
		  AND books.user_id = users.id
		`
    );
    const embeded1 = new EmbedBuilder()
      .setTitle("Reading List")
      .setColor(0xef720b)
      .addFields(
        ...rows.map((item) => {
          const timeDiffer =
            new Date(item.due_time).getTime() - new Date().getTime();
          return {
            name: `📖 ${bold(item.title)}`,
            value: `${userMention(item.id)} - ${Math.round(
              Math.abs(timeDiffer) / (1000 * 3600 * 24)
            )} ${timeDiffer > 0 ? "days remaining" : "overdue"}`,
          };
        })
      )
      .setTimestamp();
    if (new Date().getDate() === 30) {
      const { rows: users } = await db.query(
        `SELECT * 
		  FROM users
		  ORDER BY points
		  LIMIT 3
		`
      );
      const embeded2 = new EmbedBuilder()
        .setTitle("Reading List")
        .setColor(0xef720b)
        .addFields(
          {
            name: `🥇 ${userMention(users[0].id)}`,
            value: `${users[0].points} points`,
          },
          {
            name: `🥈 ${userMention(users[1].id)}`,
            value: `${users[1].points} points`,
          },
          {
            name: `🥉 ${userMention(users[2].id)}`,
            value: `${users[2].points} points`,
          }
        )
        .setTimestamp();
      channels.forEach((channelId) =>
        client.channels.cache
          .get(channelId)
          .send({ embeds: [embeded2] })
          .then((mess) => console.log(mess))
          .catch((err) => console.log(err))
      );
    }

    const embeded3 = new EmbedBuilder().setTitle("What's news!").addFields(
      { name: "What you read today?", value: "\u200B" },
      { name: "What you read next?", value: "\u200B" },
      {
        name: "Can you share your thought about your reading today?",
        value: "\u200B",
      }
    );
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("review")
        .setLabel("Review!")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("addBook")
        .setLabel("Init Book!")
        .setStyle(ButtonStyle.Primary)
    );

    channels.forEach((channelId) =>
      client.channels.cache
        .get(channelId)
        .send({ embeds: [embeded1] })
        .then((mess) => console.log(mess))
        .catch((err) => console.log(err))
    );
    channels.forEach((channelId) =>
      client.channels.cache
        .get(channelId)
        .send({ embeds: [embeded3], components: [row] })
        .then((mess) => console.log(mess))
        .catch((err) => console.log(err))
    );
  },
  null,
  false,
  "Asia/Ho_Chi_Minh"
);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  job.start();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    if (interaction.commandName === "play") {
      const connection = joinVoiceChannel({
        channelId: interaction.channel.id,
        guildId: interaction.channel.guild.id,
        adapterCreator: interaction.channel.guild.voiceAdapterCreator,
      });
      const subscription = connection.subscribe(audioPlayer);
      if (subscription) {
        // Unsubscribe after 5 seconds (stop playing audio on the voice connection)
        setTimeout(() => subscription.unsubscribe(), 5000);
      }
      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log(
          "The connection has entered the Ready state - ready to play audio!"
        );
      });
      connection.on(
        VoiceConnectionStatus.Disconnected,
        async (oldState, newState) => {
          try {
            await Promise.race([
              entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
              entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
            // Seems to be reconnecting to a new channel - ignore disconnect
          } catch (error) {
            // Seems to be a real disconnect which SHOULDN'T be recovered from
            connection.destroy();
          }
        }
      );
      if (interaction.options.getString("type") === "rain") {
        player.play(rain_resource);
        player.on("error", (error) => {
          console.error(
            `Error: ${error.message} with resource ${error.resource.metadata.title}`
          );
          player.play(getNextResource());
        });
        connection.subscribe(player);
      }
    }
    await command.execute(interaction);
    if (interaction.commandName === "init") {
      channels.add(interaction.channelId);
    }
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.type !== InteractionType.ApplicationCommandAutocomplete)
    return;

  if (
    interaction.commandName === "review" ||
    interaction.commandName === "finish"
  ) {
    const focusedValue = interaction.options.getFocused();
    const { rows } = await db.query(`SELECT id, title FROM books`);
    const filtered = rows.filter((choice) =>
      choice.title.startsWith(focusedValue)
    );
    await interaction.respond(
      filtered.map((choice) => ({
        name: choice.title,
        value: String(choice.id),
      }))
    );
  }
});

client.login(process.env.TOKEN);
