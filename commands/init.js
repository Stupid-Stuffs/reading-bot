const { SlashCommandBuilder } = require("discord.js");

const db = require("../DB");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("init")
    .setDescription("Add a book to read!")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Enter your book title")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("How long would you like to finish this book")
        .setMinValue(1)
        .setMaxValue(30)
        .setRequired(true)
    ),
  async execute(interaction) {
    console.log(interaction);
    const data = interaction.options.data;
    const user_id = interaction.user.id;
    const book_title = data[0].value;
    const num_of_days = Number(data[1].value);
    const new_date = new Date();
    new_date.setDate(new_date.getDate() + num_of_days);
    const finish_at = new_date;
    try {
      await db.query(
        `INSERT INTO books (title, user_id, "finishedAt") 
		  VALUES ($1, $2, $3) 
		  `,
        [book_title, user_id, finish_at]
      );
      await interaction.reply("Okay, I got it!");
    } catch (error) {
      console.log(error);
    }
  },
};
