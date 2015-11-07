var Discord = require("discord.js");
var config = require("./auth.json");
var request = require('request');

var bot = new Discord.Client();

function getAccessKey () {
	return new Promise(function (resolve, reject) {
		request.post("https://anilist.co/api/auth/access_token", {
			form: {
				grant_type: "client_credentials",
				client_id: "aabot-8kj86",
				client_secret: "wr5holZqPwfK6UO73N6Z7OR3714Z"
			}
		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log('success: ' + body);
				resolve(body);
			} else {
				console.log('error');
				reject(error);
			}
		});
	});
}

function getTimeTo (accesskey, anime) {
	return new Promise(function (resolve, reject) {
		request({
			url: "https://anilist.co/api/anime/" + anime,
			qs: {
				access_token: accesskey
			}
		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var anime = JSON.parse(body);
				if (anime.airing) {
					resolve(anime);
				} else {
					reject("Anime not airing");
				}
			}
		});
	});
}

function searchAnime (accessKey, query) {
	return new Promise(function (resolve, reject) {
		request({
			url: "https://anilist.co/api/anime/search/" + query,
			qs: {
				access_token: accessKey
			}
		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				if (body.length > 0) {
					resolve(JSON.parse(body));
				} else {
					reject("Anime not found");
				}
			}
		});
	});
}

function secondsToString(seconds) {
	var numdays = Math.floor(seconds / 86400);
	var numhours = Math.floor((seconds % 86400) / 3600);
	var numminutes = Math.floor(((seconds % 86400) % 3600) / 60);
	var numseconds = ((seconds % 86400) % 3600) % 60;
	return numdays + " days " + numhours + " hours " + numminutes + " minutes " + numseconds + " seconds";
}

bot.on("ready", function () {
	console.log("AABot initialised and ready");
});

bot.on("disconnected", function () {
	console.log("AABot was disconnected, closing process");
	process.exit(1);
});

bot.on("error", function (error) {
	console.log("Error Caught: " + error);
});

// Development Only
bot.on("debug", function (message) {
	console.log("AABot Debug Message: " + message);
});

// Main
bot.on("message", function (message) {

	var messageArray = message.content.split(" ");
	var command = messageArray[0];
	var theRest = messageArray.slice(1, messageArray.length);
	var context = theRest.join(" ");

	if (command == "!ping") {
		bot.reply(message, "pong");
	}
	else if (command == "!hb") {
		var req = http.get({
			host: "hummingbird.me",
			port: 80,
			path: "/api/v1/anime/" + context,
			method: "GET"
		}, function (response) {

			var body = '';
	        response.on('data', function(d) {
	            body += d;
	        });

	        response.on('end', function() {
	            // Data reception is done, do whatever with it!
	            var parsed = JSON.parse(body);
	            bot.reply(message, parsed.title);
				bot.reply(message, parsed.synopsis);
				bot.reply(message, parsed.url);
	        });

	        req.end();

		});
	}
	else if (command == "!timeto") {
		getAccessKey().then(function (body) {
			return getTimeTo(JSON.parse(body).access_token, context);
		}).then(function (anime) {
			bot.reply(message, `${anime.title_romaji} Episode ${anime.airing.next_episode} will air in ${secondsToString(anime.airing.countdown)}`);
		});
	}
	else if (command == "!search") {
		getAccessKey().then(function (body) {
			return searchAnime(JSON.parse(body).access_token, context);
		}).then(function (results) {
			results.forEach(function (result) {
				bot.reply(message, result.title_romaji + " => " + result.id);
			});
		});
	}

});

bot.login(config.auth.email, config.auth.password);