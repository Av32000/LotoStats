const { ChartJSNodeCanvas } = require('chartjs-node-canvas')
const fs = require('fs')
const path = require('path');
const { MessageAttachment } = require('discord.js');
const { MongoClient } = require("mongodb");
const dotenv = require('dotenv');
const randomColor = () => Math.floor(Math.random() * 255) + 1;



class Statistiques {
  async exec(interaction) {
    interaction.reply("Génération des graphiques...")
    dotenv.config()
    const uri = process.env.MONGOSTRING;
    const client = new MongoClient(uri);
    let number = [];
    let chance = [];
    try {
      await client.connect();
      const database = client.db("Loto");
      const movies = database.collection("Tirages");

      const query = { title: `${"numbers"}` };

      const movie = await movies.findOne(query);

      if (movie == null) {
        interaction.editReply(`Impossible de récupérer les statistiques`)
        return;
      }

      number = movie.content;
    } finally {
      await client.close();
    }

    try {
      await client.connect();
      const database = client.db("Loto");
      const movies = database.collection("Tirages");

      const query = { title: `${"chance"}` };

      const movie = await movies.findOne(query);

      if (movie == null) {
        interaction.editReply(`Impossible de récupérer les statistiques`)
        return;
      }

      chance = movie.content;
    } finally {
      await client.close();
    }

    let channel = interaction.channel
    let numbers = []
    let chances = []
    for (let i = 0; i < 50; i++) {
      let count = 0;
      number.forEach(element => {
        if (element == i.toString()) {
          count++;
        }
      });
      numbers.push(count);
    }
    for (let i = 0; i < 11; i++) {
      let count = 0;
      chance.forEach(element => {
        if (element == i.toString()) {
          count++;
        }
      });
      chances.push(count);
    }
    let colors = [];
    let r = 0;
    let g = 0;
    let b = 0;
    let existColor = [];
    for (let i = 0; i < 51; i++){
      let colorR;
      let colorG;
      let colorB;

      for (let i = 1; i > 0; i++) {
        colorR = randomColor();
        colorG = randomColor();
        colorB = randomColor();
        let colorComplete = `${colorR},${colorG},${colorB}`
        if (!existColor.includes(colorComplete)) {
          existColor.push(colorComplete)
          break
        }
      }

      let color = `rgb(${colorR}, ${colorG}, ${colorB})`
      colors.push(color);
    };

    //#region SetupChartNumber
    const width = 1000;
    const height = 1000;
    const backgroundColour = 'white';
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });

    const data = {
      labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49"],
      datasets: [{
        label: 'Apparition des différents numéros',
        data: numbers,
        backgroundColor: colors,
      }]
    };

    const configuration = {
      type: 'bar',
      data: data
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    await fs.writeFile(path.join(__dirname, "../util/chart.png"), buffer, (err) => {
      if (err) {
        console.log(err);
      }
    });
    //#endregion

    //#region SetupChartNumber

    const chartJSNodeCanvasChances = new ChartJSNodeCanvas({ width, height, backgroundColour });

    const dataC = {
      labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      datasets: [{
        label: 'Apparition des différents numéros chances',
        data: chances,
        backgroundColor: colors,
      }]
    };

    const configurationC = {
      type: 'bar',
      data: dataC
    };

    const bufferC = await chartJSNodeCanvasChances.renderToBuffer(configurationC);
    await fs.writeFile(path.join(__dirname, "../util/chances.png"), bufferC, (err) => {
      if (err) {
        console.log(err);
      }
    });
    //#endregion

    const attachementN = new MessageAttachment(path.join(__dirname, "../util/chart.png"))
    const attachementC = new MessageAttachment(path.join(__dirname, "../util/chances.png"))

    interaction.editReply({
      content: "Numéros Classiques / Numéros Chances",
      files: [attachementN, attachementC]
    })
  }
}
module.exports = Statistiques