const { SlashCommandBuilder, ChannelType } = require("discord.js");
const {entersState, joinVoiceChannel, VoiceConnectionStatus } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a noise!"),
  async execute(interaction) {
    if (!interaction.channel.type === ChannelType.GuildVoice) {
      await interaction.reply("I cannot play outside of the voice channel");
      return;
    }

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
    await interaction.reply("Pong!");
  },
};
