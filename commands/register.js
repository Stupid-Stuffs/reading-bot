const { SlashCommandBuilder } = require("discord.js");

const db = require("../DB");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Join Challenge!"),
  async execute(interaction) {
    const user = interaction.user;
    const { rows } = await db.query("SELECT * FROM users WHERE id=$1", [
      user.id,
    ]);
    if (rows?.length > 0)
      await interaction.reply("You've already joined before!");
    else {
      await db.query(
        "INSERT INTO users (id, username, avatar, tag) VALUES($1, $2, $3, $4)",
        [
          user.id,
          user.username,
          `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
          user.tag,
        ]
      );
      await interaction.reply("Welcome bro!");
    }
  },
};
