const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const db = require("../DB");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getreview")
    .setDescription("Get your reviews!")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Book Title")
        .setAutocomplete(true)
        .setRequired(true)
    ),
  async execute(interaction) {
    const data = interaction.options.data;
    const book_id = data[0].value;
    const user_id = interaction.user.id;
    const { rows } = await db.query(
      `SELECT * 
		  FROM reviews
		  WHERE reviews.user_id = $1 
		  AND reviews.book_id=$2
		`,
      [user_id, book_id]
    );
    await fs.writeFile(
      path.join(__dirname, "reviews", book_id + user_id + ".txt"),
      rows.map(item => item.message).join("\n\n"),
      (e) => console.log(e)
    );
    const send_file = new AttachmentBuilder(
      path.join(__dirname, "reviews", book_id + user_id + ".txt")
    );
    await interaction.user.send({ files: [send_file] });
    await interaction.reply("Check your inbox!");
  },
};
