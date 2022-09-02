const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a noise!")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type of sound")
        .setRequired(true)
        .addChoices({ name: "Rain", value: "rain" })
    ),
  async execute(interaction) {
    if (!interaction.channel.type === ChannelType.GuildVoice) {
      await interaction.reply("I cannot play outside of the voice channel");
      return;
    }

    await interaction.reply("Pong!");
  },
};
