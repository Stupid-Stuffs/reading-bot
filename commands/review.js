const { EmbedBuilder } = require("@discordjs/builders");
const { SlashCommandBuilder } = require("discord.js");

const db = require("../DB");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("review")
    .setDescription("Daily review of a book a book!")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Book Title")
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("message").setDescription("Your thought").setRequired(true)
    ),
  async execute(interaction) {
    const data = interaction.options.data;
    const user_id = interaction.user.id;
    await db.query(
      `
	INSERT INTO reviews (user_id, book_id, "createdAt", message)
	VALUES ($1, $2, $3, $4)
		`,
      [user_id, data[0].value, new Date(), data[1].value]
    );
    await db.query(
      `
	UPDATE users SET points = points + 5
	WHERE id = $1
		`,
      [user_id]
    );
    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: `https://cdn.discordapp.com/avatars/${user_id}/${interaction.user.avatar}.png`,
      })
      .setTimestamp()
      .addFields({ name: "\u200B", value: data[1].value });
    await interaction.reply({
      content: "You've got 5 points, keep it up bro!",
      embeds: [embed],
    });
  },
};
