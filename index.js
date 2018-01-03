const app = require("express")();
const expressWs = require('express-ws')(app);
// Escaping from callback hell with promise request library
const request = require("request-promise");
// API Developer Config data for openweather API
const openWeatherAPICred = {
	name: "georgy",
	appid: "5434aea66f7065a502c6f3a4e83b84a1",
	appUrl: "http://api.openweathermap.org/data/2.5/weather",
	city: "",
	latitude: "",
	longitude: ""
}
// URL for fetching sunset and sunrise for specified city
const sunsetSunriseUrl = "https://api.sunrise-sunset.org/json";
// API Developer Config data for world weather API
const worldWeatherAPICred = {
	name: "georgy",
	appid: "e541cb4a11814f63b5c122844180301",
	appUrl: "http://api.worldweatheronline.com/premium/v1/weather.ashx",
	city: "",
	latitude: "",
	longitude: ""
}
// Object for storing all requested weather data fields
let weatherData	= {};

// Endpoing for GET requesting of weatcher data on every 3 hours from client side. This is only optional because we also have websocket endpoint on which
// we are having 3 hour timer ( for every connection ) and sending data back to user.
// Maybe better would be to implement ServerSend Events for this kind.
app.get("/:city", (req, res, next) => {
	var openWeatherOptions = {
		uri: openWeatherAPICred.appUrl,
		qs: { appid: openWeatherAPICred.appid,q : req.params.city },
		json: true
	};
	var worldWeatherOptions = {
		uri: worldWeatherAPICred.appUrl,
		qs: { key : worldWeatherAPICred.appid , q : req.params.city , format : 'json' },
		json: true
	}
	request(openWeatherOptions)
		.then( (response) => {
			weatherData['longitude'] = response.coord.lon;
			weatherData['latitude'] = response.coord.lat;
			weatherData['sunset'] = response.sys.sunset;
			weatherData['sunrise'] = response.sys.sunrise;
			return weatherData;
		}).then((wd) => {
			return request(worldWeatherOptions)
		}).then(data => {
			let result = data.data;
			weatherData['temperature'] = result.current_condition[0].temp_C;
			weatherData['wind'] = { 
				'windspeedKmph':result.current_condition[0].windspeedKmph , 
				'winddirDegree':result.current_condition[0].winddirDegree, 
				'winddir16Point':result.current_condition[0].winddir16Point,
				'windspeedMiles':result.current_condition[0].windspeedMiles
			};
			weatherData['weatherIcon'] = result.current_condition[0].weatherIconUrl[0].value;
			weatherData['precipitation'] = result.current_condition[0].precipMM;
			return weatherData;
		}).then(wd => {
			res.send(wd);
		});
});

// WebSocket Connection to Client side. Timer is scheduled on 3 hours interval.
//10800000  =  3 hours.
app.ws("/:city", (ws, req) => {

	let timerID = 0;
	ws.on("message", (msg) => {
		timerId = setInterval(() => {
			var openWeatherOptions = {
				uri: openWeatherAPICred.appUrl,
				qs: { appid: openWeatherAPICred.appid,q : req.params.city },
				json: true
			};
			var worldWeatherOptions = {
				uri: worldWeatherAPICred.appUrl,
				qs: { key : worldWeatherAPICred.appid , q : req.params.city , format : 'json' },
				json: true
			}
			request(openWeatherOptions)
				.then( (response) => {
					weatherData['longitude'] = response.coord.lon;
					weatherData['latitude'] = response.coord.lat;
					weatherData['sunset'] = response.sys.sunset;
					weatherData['sunrise'] = response.sys.sunrise;
					return weatherData;
				}).then((wd) => {
					return request(worldWeatherOptions)
				}).then(data => {
					let result = data.data;
					weatherData['temperature'] = result.current_condition[0].temp_C;
					weatherData['wind'] = { 
						'windspeedKmph':result.current_condition[0].windspeedKmph , 
						'winddirDegree':result.current_condition[0].winddirDegree, 
						'winddir16Point':result.current_condition[0].winddir16Point,
						'windspeedMiles':result.current_condition[0].windspeedMiles
					};
					weatherData['weatherIcon'] = result.current_condition[0].weatherIconUrl[0].value;
					weatherData['precipitation'] = result.current_condition[0].precipMM;
					return weatherData;
				}).then(wd => {
					res.send(wd);
				});
		}, 10800000);
	});
	ws.on("close", () => {
		clearInterval(timerId);
	});
})



app.listen(3000, () => console.log("Server is listening on port 3000"));