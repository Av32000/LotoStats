const fs = require('fs');
const path = require('path');
const { MongoClient } = require("mongodb");
const dotenv = require('dotenv');

async function getData(interaction) {

  require('https').get('https://www.fdj.fr/jeux-de-tirage/loto/resultats', function (res) {
    var buff = new Buffer.alloc(0);

    res.on('data', function (data) {
      buff = Buffer.concat([buff, data], buff.length + data.length);
    });

    res.on('end', async function () {
      await fs.writeFile(path.join(__dirname, "../html.txt"), buff.toString('utf8'), (err) => {
        if (err) {
          console.log(err);
        }
      });
      let number1 = buff.toString('utf8').split(`<span class="game-ball">`)[1].split('<')[0];
      let number2 = buff.toString('utf8').split(`<span class="game-ball">`)[2].split('<')[0];
      let number3 = buff.toString('utf8').split(`<span class="game-ball">`)[3].split('<')[0];
      let number4 = buff.toString('utf8').split(`<span class="game-ball">`)[4].split('<')[0];
      let number5 = buff.toString('utf8').split(`<span class="game-ball">`)[5].split('<')[0];
      let chance = buff.toString('utf8').split(`<span class="game-ball is-special">`)[1].split('<')[0];
      setTimeout(() => {
        interaction.editReply({
          content: `Résultats du dernier tirage : \n${number1} - ${number2} - ${number3} - ${number4} - ${number5} / ${chance}`,
        });
      }, 1000)
    });

    res.on('error', function (e) {
      console.error(e);
    });
  });
}

async function getDataWithDate(interaction, date) {
  let channel = interaction.channel;
  require('https').get('https://www.fdj.fr/jeux-de-tirage/loto/resultats/' + date, function (res) {
    var buff = new Buffer.alloc(0);

    res.on('data', function (data) {
      buff = Buffer.concat([buff, data], buff.length + data.length);
    });

    res.on('end', async function () {
      await fs.writeFile(path.join(__dirname, "../html.txt"), buff.toString('utf8'), (err) => {
        if (err) {
          console.log(err);
        }
      });
      if (buff.toString('utf8').split(`<span class="game-ball">`)[1] == null) {
        setTimeout(() => {
          interaction.editReply({
            content: `Résultat indisponible pour le tirage du ${date}. Merci de verifier la date.`,
            ephemeral: true
          })
        }, 1000)
        return;
      }
      let number1 = buff.toString('utf8').split(`<span class="game-ball">`)[1].split('<')[0];
      let number2 = buff.toString('utf8').split(`<span class="game-ball">`)[2].split('<')[0];
      let number3 = buff.toString('utf8').split(`<span class="game-ball">`)[3].split('<')[0];
      let number4 = buff.toString('utf8').split(`<span class="game-ball">`)[4].split('<')[0];
      let number5 = buff.toString('utf8').split(`<span class="game-ball">`)[5].split('<')[0];
      let chance = buff.toString('utf8').split(`<span class="game-ball is-special">`)[1].split('<')[0];
      let dates = [];
      let numbers = [];
      let chances = [];
      const uri = process.env.MONGOSTRING;
      const client = new MongoClient(uri);
      //Récupérations des différentes dates
      try {
        await client.connect();
        const database = client.db("Loto");
        const movies = database.collection("Tirages");

        const query = { title: `${"tirages"}` };

        const movie = await movies.findOne(query);

        dates = movie.content;
        if (movie == null) {
          channel.send(`Impossible de récupérer les statistiques`)
          return;
        }

        number = movie.content;
      } finally {
        await client.close();
      }
      if (!dates.includes(date)) {
        dates.push(date);
        const filterT = { title: `tirages` };
        const filterN = { title: `numbers` };
        const filterC = { title: `chance` };
        const options = { upsert: true };
        //MAJ des dates
        try {
          await client.connect();
          const database = client.db("Loto");
          const movies = database.collection("Tirages");

          const updateDoc = {
            $set: {
              content: dates
            },
          };
          const result = await movies.updateOne(filterT, updateDoc, options);
        } finally {
          await client.close();
        }
        //MAJ des numéros
        try {
          await client.connect();
          const database = client.db("Loto");
          const movies = database.collection("Tirages");

          const query = { title: `${"numbers"}` };

          const movie = await movies.findOne(query);

          if (movie == null) {
            channel.send(`Impossible de récupérer les statistiques`)
            return;
          }

          numbers = movie.content;
        } finally {
          await client.close();
        }
        numbers.push(number1)
        numbers.push(number2)
        numbers.push(number3)
        numbers.push(number4)
        numbers.push(number5)
        try {
          await client.connect();
          const database = client.db("Loto");
          const movies = database.collection("Tirages");

          const updateDoc = {
            $set: {
              content: numbers
            },
          };
          const result = await movies.updateOne(filterN, updateDoc, options);
        } finally {
          await client.close();
        }
        //MAJ des numéros chances
        try {
          await client.connect();
          const database = client.db("Loto");
          const movies = database.collection("Tirages");

          const query = { title: `${"chance"}` };

          const movie = await movies.findOne(query);

          if (movie == null) {
            channel.send(`Impossible de récupérer les statistiques`)
            return;
          }

          chances = movie.content;
        } finally {
          await client.close();
        }
        chances.push(chance)
        try {
          await client.connect();
          const database = client.db("Loto");
          const movies = database.collection("Tirages");

          const updateDoc = {
            $set: {
              content: chances
            },
          };
          const result = await movies.updateOne(filterC, updateDoc, options);
        } finally {
          await client.close();
        }
      }
      interaction.editReply({
        content: `Résultats du tirage pour le ${date} : \n${number1} - ${number2} - ${number3} - ${number4} - ${number5} / ${chance}`,
        ephemeral: false
      });
    });

    res.on('error', function (e) {
      console.error(e);
    });
  });
}

class GetTirage {
  async exec(interaction, dates) {
    if (dates == null) {
      interaction.reply('Récupération du tirage...')
      getData(interaction)
    } else {
      let dateFormat = dates.split("/");
      if (dateFormat[1] == null || dateFormat[2] == null) {
        interaction.reply("Date non valide");
        return
      }
      let date = new Date(`${dateFormat[2]}-${dateFormat[1]}-${dateFormat[0]}`)
      let day;
      let mois;
      switch (date.getDay()) {
        case 0:
          day = "dimanche"
          break;
        case 1:
          day = "lundi"
          break;
        case 2:
          day = "mardi"
          break;
        case 3:
          day = "mercredi"
          break;
        case 4:
          day = "jeudi"
          break;
        case 5:
          day = "vendredi"
          break;
        case 6:
          day = "samedi"
          break;
        default:
          interaction.reply("Erreur inatendu concernant le jour de la semaine")
          return;
      }
      switch (date.getMonth()) {
        case 0:
          mois = "janvier"
          break;
        case 1:
          mois = "fevrier"
          break;
        case 2:
          mois = "mars"
          break;
        case 3:
          mois = "avril"
          break;
        case 4:
          mois = "mai"
          break;
        case 5:
          mois = "juin"
          break;
        case 6:
          mois = "juillet"
          break;
        case 7:
          mois = "aout"
          break;
        case 8:
          mois = "septembre"
          break;
        case 9:
          mois = "octobre"
          break;
        case 10:
          mois = "novembre"
          break;
        case 11:
          mois = "decembre"
          break;
        default:
          interaction.reply("Erreur inatendu concernant le mois de l'année")
          return;
      }

      dotenv.config()
      interaction.reply('Récupération du tirage...')
      getDataWithDate(interaction, `${day}-${dateFormat[0]}-${mois}-${dateFormat[2]}`)
    }
  }
}
module.exports = GetTirage