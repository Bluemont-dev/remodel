const mongoose = require("mongoose");
const Night		= require ("../models/night");

//the following data will test the case when no record is more recent than 24 hours old
let oldDate1 = new Date('December 17, 1995 03:24:00');
let oldDate2 = new Date('September 12, 2020 05:24:00');
var data = [
    {
        players : [ ],
        games : [ ],
        hostID : "5f64e8435aafff11d7f32f7f",
        amtAnte : 0.1,
        amtMaxOpen : 0.25,
        amtMaxRaise : 0.5,
        amtBetIncrements : 0.05,
        dateCreated: oldDate1
    },
    {
        players : [ ],
        games : [ ],
        hostID : "5f64e8435aafff11d7f32f7f",
        amtAnte : 0.05,
        amtMaxOpen : 0.25,
        amtMaxRaise : 0.5,
        amtBetIncrements : 0.05,
        dateCreated: oldDate2
    }
]

function seedNightDB(){

    console.log("I am now running the seedNight function");
    //Remove all nights
    Night.deleteMany({}, function(err){
        if(err){
        console.log(err);
        } else {
        console.log("removed all nights from DB!");
        }
    });

    //loop thru data array and create and save records for each item
    // data.forEach(function(seed){
    //     Night.create(seed, function(err, night){
    //         if(err){
    //         console.log(err);
    //         } else {
    //         console.log("added a night");
    //         night.save();
    //         }
    //     });
    // }); 
}

     module.exports = seedNightDB;