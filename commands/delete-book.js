const { SlashCommandBuilder } = require("discord.js");

const db = require("../DB");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deletebook")
    .setDescription("Delete a book!")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Enter your book title")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async execute(interaction) {
    const data = interaction.options.data;
    const user_id = interaction.user.id;
    const book_id = data[0].value;
    try {
      await db.query(
        `DELETE FROM books 
		  WHERE id=$1 
		  AND user_id=$2
		  `,
        [book_id, user_id]
      );
      await interaction.reply("Alright, you deleted this book!");
    } catch (error) {
      console.log(error);
    }
  },
};
