const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const userSchema = new Schema({
    "userName" : {
        "type" : String,
        "unique" : true
    },
    "password" : String,
    "email" : String,
    "loginHistory" :[{
        "dateTime" : Date,
        "userAgent" : String
    }]
});

let User; // to be defined on new connection 

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://web322User:HarshSheti@senecaweb.v0cige8.mongodb.net/web322_week8?retryWrites=true&w=majority");

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};

module.exports.registerUser = function(userData){
    return new Promise(function(resolve, reject){
        if(userData.password2 != userData.password){
            reject("Password do not match");
        } 
        else{
            bcrypt.genSalt(10) // Generate a "salt" using 10 rounds
            .then(salt=>bcrypt.hash(userData.password,salt)) 
            .then(hash=>{
                userData.password = hash;
                let newUser = new User(userData);
                newUser.save((err) => {
                   if(err && err.code == 11000) {
                        reject("User Name already taken for:"+ userData.userName);
                    } 
                    else if(err){
                        reject("There was an error creating the user:"+ err);
                    } 
                    else {
                       resolve();
                   }
                });
            })
            .catch(err=>{
                console.log(err); // Show any errors that occurred during the process
                reject("There was an error encrypting the password");
            });
        }
    }); 
};

module.exports.checkUser = function(userData){
    return new Promise(function(resolve,reject){
        User.find({ userName: userData.userName })
        .exec()
        .then((users) =>{
            if(users.length == 0){
                reject("Unable to find user: "+  userData.userName );
            } else{
                bcrypt.compare(userData.password, users[0].password)
                .then((result) => {
                    users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                    User.updateOne(
                        {userName: users[0].userName},
                        {$set: {loginHistory: users[0].loginHistory}}
                    )
                    .exec()
                    .then((user) =>{
                        resolve(users[0]);
                    })
                    .catch((err) =>{
                        console.log(err);
                        reject("There was an error verifying the user:"+ err);
                    });
                })
                .catch((err) => {
                    reject("Incorrect Password for user: "+ userData.userName );
                });
            }
        })
        .catch((err) =>{
            console.log(err);
            reject("Unable to find user: "+  userData.userName )
        
        });
    });
};
