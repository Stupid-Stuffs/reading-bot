const {
  SlashCommandBuilder,
  EmbedBuilder,
  bold,
} = require("discord.js");

const db = require("../DB");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Leader board!"),
  async execute(interaction) {
    const { rows: users } = await db.query(
      `SELECT * 
		  FROM users
		  ORDER BY points DESC
		  LIMIT 3
		`
    );
    const icons = ["🥇", "🥈", "🥉"];
    const embeded2 = new EmbedBuilder()
      .setTitle("Leader Board")
      .setColor(0xef720b)
      .setFields(
        ...users.map((item, index) => ({
          name: `${icons[index]} ${bold(item.username)}`,
          value: `${item.points} points`,
        }))
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embeded2] });
  },
};
