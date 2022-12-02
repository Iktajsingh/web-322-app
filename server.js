/***********************************************************************
**********
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic
Policy. No part * of this assignment has been copied manually or electronically from any
other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Harsh Sethi
  Student ID: 121889216
  Date: 02/1/2022

*
* Online (cyclic) Link: https://shy-ruby-puppy-gown.cyclic.app/

************************************************************************
********/


var express = require("express");
var app = express();
var path = require('path');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const stripJs = require('strip-js');
var blogservice = require(__dirname + '/Blog-service.js');
var authData = require(__dirname + '/auth-Service.js');
const clientSessions = require("client-sessions");

var HTTP_PORT = process.env.PORT || 8080;


app.engine('.hbs', exphbs.engine({ 
  extname: ".hbs", 
  defaultLayout: "main",
  helpers: {
      navLink: function(url, options){
          return '<li' + 
              ((url == app.locals.activeRoute) ? ' class="active" ' : '') + '><a href="' + url + '">' + options.fn(this) + '</a></li>'; },
      equal: function (lvalue, rvalue, options) {
          if (arguments.length < 3)
              throw new Error("Handlebars Helper equal needs 2 parameters");
          if (lvalue != rvalue) {
              return options.inverse(this);
          } else {
              return options.fn(this);
          }
      },
      safeHTML: function(context){
          return stripJs(context);
      },
      formatDate: function(dateObj){
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.PadStart(2, '0')}-${day.padStart(2,'0')}`;
      },
              
  } 
}));

app.set("view engine", ".hbs");

app.use(express.static('public'));

cloudinary.config({
  cloud_name: 'dwslgxp7b',
  api_key: '474295251232519',
  api_secret: 'Of9poBBYwVWlYvfiWJBtgJX5nl8',
  secure: true
});

const upload = multer() // no { storage: storage }

app.use(clientSessions({
  cookieName: "session",
  secret: "assignment6_web322",
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}));

app.use(express.urlencoded({extended: true}));

app.use(function(req, res, next) {
  res.locals.session = req.session;
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
  
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

function onHttpStart(){
    console.log('Express http server listening on ' + HTTP_PORT);
}

app.get('/', (req, res) =>
{
    res.redirect('/blog')
});

app.get('/about', (req, res) => 
{
  res.render(path.join(__dirname + "/views/about.hbs"));  
});

app.get('/blog', async (req, res) => {

  let viewData = {};

  try{
      let posts = [];

      if(req.query.category){
          posts = await blogservice.getPublishedPostsByCategory(req.query.category);
      }else{
          posts = await blogservice.getPublishedPosts();
      }

      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      let post = posts[0]; 

      viewData.posts = posts;
      viewData.post = post;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      let categories = await blogservice.getCategories();

      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  res.render("blog", {data: viewData})

});

app.get('/blog/:id', async (req, res) => {

  let viewData = {};

  try{
      let posts = [];

      if(req.query.category){
          posts = await blogservice.getPublishedPostsByCategory(req.query.category);
      }else{
          posts = await blogservice.getPublishedPosts();
      }

      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      viewData.posts = posts;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      viewData.post = await blogservice.getPostById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      let categories = await blogservice.getCategories();

      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  res.render("blog", {data: viewData})
});

app.get("/posts", ensureLogin, function (req, res) {

    if (req.query.category) {
      blogservice.getPostsByCategory(req.query.category).then((data) => {
        if(data.length>0)
        {
          res.render("posts", {posts: data});
        }
        else{
          res.render("posts", {message: "no results"});
        }
        
      }).catch(function(err){
        res.render("posts", {message: "no results"});
      })
    }

     else if (req.query.minDate) {
      blogservice.getPostsByMinDate(req.query.minDate).then((data) => {
        res.render("posts", {posts: data});
      }).catch(function(err){
        res.render("posts", {message: "no results"});
      })
    }

    else {
      blogservice
        .getAllPosts()
      .then(function (data) {
        res.render("posts", {posts: data});
      })
      .catch(function (err) {
        res.render("posts", {message: "no results"});
      });
    }
  });

  app.get('/post/:id', ensureLogin, (req,res)=>{
    blogservice.getPostById(req.params.id).then((data)=>{
 
     res.json(data);
    }) .catch(function (err) {
       res.json({ message: err });
     });
 
 
   });

app.get("/categories", ensureLogin, function (req, res)
{
    blogservice.getCategories().then(function (data)
    {
      if(data.length>0){
        res.render("categories", {categories: data});
      }
      else{
        res.render("categories", {message: "no results"});
      }
    }).catch(function(err) {
      res.render("categories", {message: "no results"});
    })
});

app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory");
});

app.post("/categories/add", ensureLogin, (req, res) => {
  blogservice.addCategory(req.body).then(() => {
    res.redirect("/categories");
  });
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  blogservice.deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).render("categories", {
        errorMessage: "Unable to Remove Category / Category Not Found",
      });
    });
});

app.get('/posts/add', ensureLogin, function (req,res)
{
  blogservice
    .getCategories()
    .then((data) => res.render("addPost", { categories: data }))
    .catch((err) => res.render("addPost", { categories: [] }));

});

app.post("/posts/add", ensureLogin, upload.single("featureImage"), (req,res)=>{

  if(req.file){
      let streamUpload = (req) => {
          return new Promise((resolve, reject) => {
              let stream = cloudinary.uploader.upload_stream(
                  (error, result) => {
                      if (result) {
                          resolve(result);
                      } else {
                          reject(error);
                      }
                  }
              );
  
              streamifier.createReadStream(req.file.buffer).pipe(stream);
          });
      };
  
      async function upload(req) {
          let result = await streamUpload(req);
          console.log(result);
          return result;
      }
  
      upload(req).then((uploaded)=>{
          processPost(uploaded.url);
      });
  }else{
      processPost("");
  }

  function processPost(imageUrl){
      req.body.featureImage = imageUrl;
      req.body.postDate = new Date().toISOString().split('T')[0];
      blogservice.addPost(req.body).then(post=>{
          res.redirect("/posts");
      }).catch(err=>{
          res.status(500).send(err);
      })
  }   
});

app.get("/posts/delete/:id", ensureLogin, (req, res) => {
  blogservice.deletePostById(req.params.id)
    .then(() => {
      res.redirect("/posts");
    })
    .catch((err) => {
      res.status(500).render("posts", {
        errorMessage: "Unable to Remove Post / Post Not Found",
      });
    });
});

app.get("/login", (req, res) =>{
  res.render("login");
});

app.get("/register", (req, res) =>{
  res.render("register");
});

app.post("/register", (req, res) =>{  
  authData
  .registerUser(req.body)
  .then((user) =>{
    res.render('register', {successMessage: "User created"});
  })
  .catch((err) =>{
    console.log(err);
    res.render("register", {errorMessage: err, userName: req.body.userName});
  });
});

app.post("/login", (req, res) =>{
  req.body.userAgent = req.get('User-Agent');
  authData
  .checkUser(req.body)
  .then((user) => {
    req.session.user = {
    userName: user.userName,
    email: user.email,
    loginHistory: user.loginHistory 
    }
    res.redirect('/posts');
   })
   .catch((err) =>{
    console.log(err); 
    res.render("login", { errorMessage: err, userName: req.body.userName});
   });
});

app.get("/logout", (req, res) =>{
  req.session.reset();
  res.redirect('/');
});

app.get("/userHistory", ensureLogin, (req,res) =>{
  res.render("userHistory");
});

app.get('*', function(req, res){
    res.status(404).send("Page Not Found!");
  });

blogservice.initialize()
.then(authData.initialize)
.then(() => 
{
    app.listen(HTTP_PORT, onHttpStart());
}).catch (() => {
    console.log("ERROR : From starting the server");

  });