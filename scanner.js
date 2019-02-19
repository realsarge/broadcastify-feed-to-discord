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
var phantom = require('phantom');

// SET CHANNELS
var scannerchannel = "CHANNELID"
var textchannel = "CHANNELID"

// SET VARIABLES
var currentstream = defaultstream
var changeto

// START
client.on('ready', () => {
    client.channels.get(textchannel).send('Police Scanner reboot sucsessful.\n`' + new Date() + '`');
    let channel = client.channels.get(scannerchannel);
    client.user.setActivity(currentstream.name, {
        type: "LISTENING",
        url: currentstream.stream
    })
    console.log('BOT Started.');
    checktop();
    setInterval(checktop, 1200000); // CHECK FREQUENCY
});

// GET TOP STREAM
function checktop() {
    request({
        uri: "https://www.broadcastify.com/listen/top",
    }, function (error, response, html) {
        var C$ = cheerio.load(html);
        topstreamname = (C$('.w100 a').first().text()); // GET STREAM NAME
        topstreamlink = 'https://www.broadcastify.com' + (C$('.w100 a').attr('href')) + '/web'; // GET STREAM LINK
        phantomcheck(topstreamname, topstreamlink)
        console.log('Top stream: ' + topstreamname)
    })
};

function phantomcheck(topstreamname, topstreamlink) {
    if ((topstreamname) && (topstreamlink)) {
        phantom.create().then(function (ph) {
            ph.createPage().then(function (page) {
                page.open(topstreamlink).then(function (status) {
                    var p = page.evaluate(function () {
                        return document.getElementsByTagName('audio')[0].src // FIND AUDIO ELEMENT
                    });
                    p.then(function (pagecontent) {
                        if (pagecontent[0] !== undefined) {
                            if (pagecontent !== currentstream.stream) {
                                update(pagecontent, topstreamname);
                                console.log('Update: ' + pagecontent)
                            } else {
                                console.log('Check: ' + pagecontent)
                            }
                        } else {
                            console.log(pagecontent)
                        }
                        ph.exit();
                    });
                });
            });
        });
    }
};

// UPDATE CURRENT STREAM
function update(streamlink, streamname) {
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

client.login("TOKEN");
