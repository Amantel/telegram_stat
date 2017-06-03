const express = require('express');
const bodyParser = require('body-parser');

const http = require('http');
const https = require("https");
const url = require('url');

const request = require('request');
const async = require('async');
const cheerio = require('cheerio');

const fs = require('fs-extra');

const instaUrl="https://instantview.telegram.org";



//saveToFile();

function saveToFile() {
	console.log("START");

	request(instaUrl+"/contest", function (err, response, body) {

		if (!err && response.statusCode == 200) {
			//console.log(body);
			var $ = cheerio.load(body);

			console.log($('h1').text());

			var templateUrlList=[];

			$(".list-group-contest-item").each((i,el)=>{
				var domain=$(el).find(".contest-item-domain a");
				var template=$(el).find(".contest-item-templates a");
				var domainName=domain.text().trim();
				var templateUrl=template.attr("href");
				//console.log("> "+domainName+" >> "+instaUrl+templateUrl);
				templateUrlList.push(templateUrl);
			});
			
			
			//var templateUrlList=templateUrlList.slice(0,1);

			async.mapLimit(templateUrlList,20,
					(function (templateUrl, callback) {

						request(instaUrl+templateUrl, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								if (!body) {
									callback("Template page has no body", 0);
								} else {
									var $ = cheerio.load(body);
									var candidates=$(".contest-section").first().find(".list-group-contest-item");
									var candidatesInfo=[];
									candidates.each((i,el)=>{
										var els=$(el);
										candidate={											
											"nickName":els.find(".contest-item-author").text(),
											"nickURL":els.find(".contest-item-author a").attr("href"),
											"templateURL":els.find(".contest-item-num a").attr("href"),
											"templateStatus":els.find(".contest-item-status").text(),
											"lastUpdate":els.find(".contest-item-date").text()
										};
										candidatesInfo.push(candidate);
									});

									var infoObject={
										"domain":$("#breadcrumb li.active").text(),
										"totalTemplates":$(".contest-section .list-group-contest-item").length,
										"candidateTemplates":candidates.length,
										"candidates":candidatesInfo
									};

									callback(null, infoObject);
								}
							} else {
								callback("Template page opening failed", 0);
							}
						}.bind({ templateUrl: templateUrl }));


					}),
					function (err, infoObjectArray) {
						if (err) {
							console.log("Some Template Page Error");
						} else {
							var nowTime=new Date().toISOString().slice(0, 19).replace(/:/g, '_').replace(/-/g, '_');
							logToFile(nowTime+"_telegramContest.json", infoObjectArray);
							console.log("END");
						}
					});

			

			
			
			
		} else {
			console.log("Request main page URL error");
		}
	});
}

//logToFile("text.json", [{"a":1,"b":2},{"a":3,"b":4}]);
/*
fs.readJson('text.json', (err, data) => {
  if (err) 
  	throw err;
  console.log(data);
});
*/

function logToFile(file_name, jsonResult) {

    fs.writeFile(file_name, JSON.stringify(jsonResult), function (err) {
        if (err) {
            console.log(err);
            return false;
        } else {
            console.log(file_name + " written");
        }
    });
}
