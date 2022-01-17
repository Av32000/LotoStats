const { Intents, Client, Constants } = require('discord.js')
const dotenv = require('dotenv')
const { MongoClient } = require("mongodb");
const schedule = require('node-schedule');

const job = schedule.scheduleJob('00 00 00 * * *', function () {
  let file = require('./util/getTirageED')
  let instance = new file
  instance.exec();
});

dotenv.config()

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
  ]
})

client.on('ready', () => {
  console.log("The bot is ready !")

  const guildID = "895704892021288971"
  const guild = client.guilds.cache.get(guildID)
  let commands

  if (guild) {
    commands = guild.commands
  } else {
    commands = client.application.commands
  }

  commands?.create({
    name: "ping",
    description: "Renvoie pong si le bot est allumé"
  })
  commands?.create({
    name: "repeat",
    description: "Renvoie le message",
    options: [
      {
        name: "text",
        description: "Le texte a envoyer",
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING
      }
    ]
  })

  commands?.create({
    name: "tirage",
    description: "Renvoie le tirage du jour",
    options: [
      {
        name: "date",
        description: "La date du tirage (dd/mm/yyyy)",
        required: false,
        type: Constants.ApplicationCommandOptionTypes.STRING
      }
    ]
  })

  commands?.create({
    name: "statistiques",
    description: "Renvoie les statistiques pour les 30 derniers tirages"
  })

  commands?.create({
    name: "add_classique",
    description: "Ajoute les nombres classiques"
  }).then((command) => {command.delete()})

})

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName, options } = interaction

    if (commandName == "ping") {
      let file = require('./commands/ping')
      let instance = new file
      instance.exec(interaction);
    } else if (commandName == "repeat") {
      let file = require('./commands/repeat')
      let instance = new file
      instance.exec(interaction, options.getString("text"));
    } else if (commandName == "tirage") {
      let file = require('./commands/getTirage')
      let instance = new file
      instance.exec(interaction, options.getString("date"));
    } else if (commandName == "statistiques") {
      let file = require('./commands/statistiques')
      let instance = new file
      instance.exec(interaction);
    }
  }
})

async function intDB() {
  try {
    await MongoClient.connect(process.env.MONGOSTRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log("Connecter à la BDD");
  } catch (e) {
    console.log("Impossible de se connecter à la BDD\n\n", e);
    return process.exit();
  }
}

intDB()
client.login(process.env.TOKEN);