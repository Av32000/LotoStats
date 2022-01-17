class Repeat{
  exec(interaction, text){
    interaction.channel.send(text)
    interaction.reply({
      content:"Le message a bien été envoyé",
      ephemeral: true
    })
  }
}
module.exports = Repeat