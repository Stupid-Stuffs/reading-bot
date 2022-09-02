const { SlashCommandBuilder } = require("discord.js");

const db = require("../DB");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("finish")
    .setDescription("Finish a Book!")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Book Title")
        .setAutocomplete(true)
        .setRequired(true)
    ),
  async execute(interaction) {
    const data = interaction.options.data;
    const user_id = interaction.user.id;
    await db.query(
      "UPDATE books SET is_finished = true, finishedAt = $3 WHERE id = $1 AND user_id=$2",
      [data[0].value, user_id, new Date()]
    );
    await db.query(
      `
	UPDATE users SET points = points + 2
	WHERE id = $1
		`,
      [user_id]
    );
    await interaction.reply("Congratulation! You've got 2 bonus points");
  },
};
