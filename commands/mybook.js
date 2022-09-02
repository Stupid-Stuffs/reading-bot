const {
  SlashCommandBuilder,
  bold,
  EmbedBuilder,
  userMention,
} = require("discord.js");

const db = require("../DB");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mybook")
    .setDescription("List your books!"),
  async execute(interaction) {
    const { rows } = await db.query(
      `SELECT * 
		  FROM books, users
		  WHERE is_finished = false
		  AND books.user_id = users.id
		  AND users.id=$1
		`,
      [interaction.user.id]
    );
    const embeded1 = new EmbedBuilder()
      .setTitle(`${interaction.user.username}'s Books`)
      .setColor(0xef720b)
      .setFields(
        ...rows.map((item) => {
          const timeDiffer =
            new Date(item.due_time).getTime() - new Date().getTime();
          return {
            name: `📖 ${bold(item.title)}`,
            value: `${userMention(item.id)} - ${Math.ceil(
              Math.abs(timeDiffer) / (1000 * 3600 * 24)
            )} ${timeDiffer > 0 ? "days remaining" : "overdue"}`,
          };
        })
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embeded1] });
  },
};
