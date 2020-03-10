//-----------------------------------------------------------
// REQUIREMENTS
//-----------------------------------------------------------
var bodyParser               = require("body-parser");
var methodOverride           = require("method-override");
var expressSanitizer         = require("express-sanitizer");
var mongoose                 = require("mongoose");
var express                  = require("express");
var app                      = express();
var passport                 = require("passport");
var User                     = require("./models/user");
var LocalStrategy            = require ("passport-local");
var passportLocalMongoose    = require("passport-local-mongoose");
const port                   = 3000;

//-----------------------------------------------------------
// Connecting to RESTfullBlogApp Database
//-----------------------------------------------------------
//mongoose.connect('mongodb://localhost:27017/restful_blog_app', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect(process.env.DATABASEURL,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    }).then(() => { console.log('Database is connected') }, err => { console.log('Can not connect to the database' + err) });

//-----------------------------------------------------------
// APP CONFIG
//-----------------------------------------------------------
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));


//-----------------------------------------------------------
// Set Passport
//-----------------------------------------------------------

app.use(require("express-session")({
    secret: "My name is Jelle",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//-----------------------------------------------------------
//  MONGOOSE/MODEL CONFIG
//-----------------------------------------------------------
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    website: String,
    catogory: String,
    created:  {type: Date, default: Date.now}

});
var Blog = mongoose.model("Blog", blogSchema);

//-----------------------------------------------------------
// RESTFUL ROUTES
//-----------------------------------------------------------
app.get("/", function(req, res){
    res.redirect("/blogs");
});
// INDEX ROUTE -> List
app.get("/blogs", function(req, res){
    Blog.find({}, function(err, blogs){
        if(err){
            console.log("ERROR!");
        } else {
            res.render("index", {blogs: blogs});
        }
    }).sort({ created: 'desc' });
});

//INDEX ROUTE -> Tumb
app.get("/blogs/tumb", function(req, res){
    Blog.find({}, function(err, blogs){
        if(err){
            console.log("ERROR!");
        } else {
            res.render("tumb", {blogs: blogs});
        }
    }).sort({ created: 'desc' });
});

//==========================================================================
// Auth Routes
//==========================================================================
app.get("/register", function(req, res){
    res.render("register");
});

//
app.post("/register", function(req, res){
    req.body.username
    req.body.password
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if (err){
            console.log(err);
            return res.render('register');
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/geregistreerd");
        });
    });
});

//==========================================================================
//Login route
//==========================================================================
app.get("/login", function(req, res){
    res.render("login");
});


//==========================================================================
// Login Logic
//==========================================================================
app.post("/login", passport.authenticate("local", { 
    
    successRedirect: "/secret",
    failureRedirect: "/geentoegang",
}) ,function(req, res){
});

app.get("/geentoegang", function(req, res){
    res.render("geentoegang");
});

app.get("/secret",isLoggedIn, function(req, res){
    res.render("secret");
});

//==========================================================================
//LOGOUT
//==========================================================================

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");  
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


app.get("/geregistreerd", function(req, res){
    res.render("geregistreerd");
});



// NEW ROUTE
app.get("/new", isLoggedIn, function(req, res){
    res.render("new");
});

// CREATE ROUTE
app.post("/blogs", function(req, res){
    //create blog
   req.body.blog.body = req.sanitize(req.body.blog.body)
    Blog.create(req.body.blog, function(err, newBlog){
        if(err){
            res.render("new");
        } else {
                //redirect
            res.redirect("/blogs");
        }
    });
});

//SHOW ROUTE
app.get("/blogs/:id", function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            res.redirect("/blogs");
        } else {
            res.render("show", {blog: foundBlog});
        }
    })
});

//EDIT ROUTE
app.get("/blogs/:id/edit",isLoggedIn, function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            res.redirect("/blogs");
        } else{
            res.render("edit", {blog: foundBlog});
        }
    })
})

//UPDATE ROUTE
app.put("/blogs/:id", function(req, res){
    req.body.blog.body = req.sanitize(req.body.blog.body)
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
        if(err){
            res.redirect("/blogs");
        } else {
                res.redirect("/blogs/" + req.params.id);

            }
    });
});

//DELETE ROUTE
app.delete("/blogs/:id",isLoggedIn, function(req, res){
    Blog.findByIdAndRemove(req.params.id, function(err){
        if (err){
            res.redirect("/blogs");
        } else{
            res.redirect("/blogs");
        }
    })

});

//==========================================================================
//PORT 3000
//==========================================================================
//app.listen(port, () => console.log('Blog Server is gestart op poort ' +port));  
app.listen(process.env.PORT, process.env.IP, function () {
    console.log("The server has started");
  });