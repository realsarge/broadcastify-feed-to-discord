// DEFAULT SETTING
var defaultstream = {
    name: "STBY",
    stream: ""
}

// REQUIRE WHATS NEEDED
const Discord = require('discord.js');
const client = new Discord.Client();
const {
    RichEmbed
} = require('discord.js');
var request = require("request");
var cheerio = require('cheerio');

var puppeteer = require('puppeteer');

// SET CHANNELS
var scannerchannel = "CHANNELID"
var textchannel = "LOGCHANNELID"

// SET VARIABLES
var currentstream = defaultstream
var changeto

var top = 2 // # OF FEED FROM TOP OF THE PAGE

// START
client.on('ready', () => {
    client.channels.get(textchannel).send('Police Scanner reboot sucsessful.\n`' + new Date() + '`');
    let channel = client.channels.get(scannerchannel);
    client.user.setActivity(currentstream.name, {
        type: "LISTENING",
        url: currentstream.name
    })
    console.log('Init.');
    checktop();
    setInterval(checktop, 1200000); // CHECK FREQUENCY
});

// GET TOP STREAM
function checktop() {
    console.log('Check Started.')
    request({
        uri: "https://www.broadcastify.com/listen/top",
    }, function (error, response, html) {
        var C$ = cheerio.load(html);
        topstreamname = (C$('.w100 a').eq(top+2).text()); // GET STREAM NAME
        topstreamlink = 'https://www.broadcastify.com' + (C$('.w100 a').eq(top+2).attr('href')) + '/web'; // GET STREAM LINK
        console.log(topstreamname)
        console.log("Current stream: " + currentstream.name)
        if ((topstreamname) && (topstreamlink)) {
            console.log("Got TOP stream name and link.")
            console.log("TOP stream: " + topstreamname)
            if (topstreamname !== currentstream.name) {
                console.log("New TOP stream found, updating.")
                browsercheck(topstreamname, topstreamlink)
            }
        }
    })
};

function browsercheck(topstreamname, topstreamlink) {
    console.log("Browser check started.");
    (async () => {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(topstreamlink);
        console.log("URL opened.")
        var getlink = await page.evaluate(() => {
            var audioelement = document.getElementsByTagName('audio')[0].src;
            console.log("Audio element found, direct stream link: " + audioelement)
            return audioelement;
        });
        update(getlink, topstreamname);
        await browser.close();
        console.log("Browser closed.")
    })();
};

// UPDATE CURRENT STREAM
function update(streamlink, streamname) {
    console.log('Updating stream.')
    let channel = client.channels.get(scannerchannel);
    changeto = {
        name: streamname,
        stream: streamlink
    }
    currentstream = changeto
    defaultstream = currentstream
    channel.leave()
    channel.join()
        .then(connection => {
            console.log('Connected to ' + scannerchannel)
            connection.playArbitraryInput(currentstream.stream)
            client.user.setActivity(currentstream.name, {
                type: "LISTENING",
                url: streamlink
            })
        })
}

client.on('message', message => {
    if (message.content === 'ping') {
        if (message.member.roles.find("name", "ROLE")) {
            console.log('Got ping command.')
            let channel = client.channels.get(scannerchannel);
            message.channel.send("pong");
            currentstream = ""
            channel.leave()
            channel.join()
            checktop();
        }
    }
});

client.login("TOKEN");
