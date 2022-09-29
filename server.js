/***********************************************************************
**********
* WEB322 – Assignment 02
* I declare that this assignment is my own work in accordance with Seneca Academic
Policy. No part * of this assignment has been copied manually or electronically from any
other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: iktaj singh 
  Student ID: 121789218
  Date:29/09/2022

*
* Online (Heroku) Link: 

************************************************************************
********/


var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var app = express();
var path = require('path');
var blogservice = require(__dirname + '/blog-service.js');

onHttpStart = () => 
{
    console.log('Express http server listening on ' + HTTP_PORT);
}

app.use(express.static('public'));

app.get('/', (req, res) =>
{
    res.redirect('/about')
});

app.get('/about', (req, res) => 
{
    res.sendFile(path.join(__dirname + "/views/about.html"));
});

app.get("/blog", (req, res) => 
{
    blogservice.getPublishedPosts().then((data) =>
    {
        res.json({data});
    }).catch((err) => {
        res.json({message: err});
    })
});

app.get("/posts", (req, res) => 
{
    blogservice.getAllPosts().then((data) =>
    {
        res.json({data});
    }).catch((err) => {
        res.json({message: err});
    })
});

app.get("/categories", (req, res) => 
{
    blogservice.getCategories().then((data) =>
    {
        res.json({data});
    }).catch((err) => {
        res.json({message: err});
    })
});

app.get('*', function(req, res){
    res.status(404).send("Page Not Found!");
  });

blogservice.initialize().then(() => 
{
    app.listen(HTTP_PORT, onHttpStart());
}).catch (() => {
    console.log("ERROR : From starting the server");
});