//This is an Express app, so let's get Express!

const express = require('express'); //This grabs Express
let app = express(); //This makes an Express app
const helmet = require('helmet'); //Gives basic security protection for Express
const config = require('./config'); //Grabs the config from the current directory
const bcrypt = require('bcrypt-nodejs');
const expressSession = require('express-session');
app.use(helmet()); //Helmets protect bikers and Express apps :^ )
    //app.use() adds Middleware (any function that has access to req and res)

const sessionOptions = ({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    //cookie: {secure:true} This is needed when you have an https site
});
app.use(expressSession(sessionOptions));

const mysql = require('mysql'); //Grabs mysql
let connection = mysql.createConnection(config.db); //Create mysql connection to database

//Let's connect!
connection.connect();

//Let's add EJS so we can render
app.set('views','views'); //Picks directory | Arg1: Name of property & Arg2: Name of Folder
app.set('view engine','ejs'); //Sets rendering engine to EJS

//SET UP PUBLIC FOLDER
app.use(express.static('public')); //express.static() is middleware too!

//Get BODY PARSER & URLENCODE Middleware
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

//Middleware to send user data to view if logged in
app.use('*',(req,res,next)=>{
    if(req.session.loggedIn){
        res.locals.name = req.session.name;
        res.locals.email = req.session.email;
        res.locals.id = req.session.id;
    } else {
        res.locals.name = '';
        res.locals.email = '';
        res.locals.id = '';
    }
    next();
})

app.get('/',(req,res,next)=>{
    if(!req.session.loggedIn){
        res.redirect('/login?msg=mustLogin');
    } else {
        const gpQuery = `SELECT * FROM guineapigs WHERE id NOT IN(
            SELECT gp_id FROM votes WHERE u_id = ?)`; //Our SQL query
        connection.query(gpQuery,[req.session.uid],(err,results)=>{   //Passing the query into our connection
            if(err){throw(err);} //Troubleshooting for errors

            //Check for msg query string
            let msg;
            if(req.query.msg == 'regSuccess'){
                msg = 'You have successfully registered!';
                console.log(msg);
            } else if(req.query.msg == 'loginSuccess'){
                msg = 'You have successfully logged in!';
            }

            if(results.length === 0){
                res.render('index',{
                    guineapig:null,
                    msg: "You have voted on all of the guinea pigs! Please wait for our newest additions or check out the current standings!"
                })
            } else {
                const rand = Math.floor(Math.random() * results.length); //Random number from 0 to results.length
                res.render('index',{    //Renders the index file in views
                    guineapig:results[rand], //Populates the query results into the res object
                    msg
                });
            }
        })
    }
});

app.get('/vote/:value/:id',(req,res,next)=>{
    const value = req.params.value;
    const g_id = req.params.id;
    const insertQuery = `INSERT INTO votes (id,gp_id,score,u_id) VALUES (DEFAULT,?,?,?)`;
    connection.query(insertQuery,[g_id,value,req.session.uid],(err,results)=>{
        if(err){throw(err);}
        res.redirect('/');
    });
})

app.get('/standings', (req,res,next)=>{
    const standingsQuery = `SELECT SUM(IF(score="likethis",1,-1)) AS total_score,MAX(guineapigs.name) AS gp_name from votes
        INNER JOIN guineapigs ON votes.gp_id = guineapigs.id
        GROUP BY guineapigs.name
        ORDER BY total_score DESC;`;
    connection.query(standingsQuery,(err,results)=>{
        if(err){throw(err);}
        res.render('standings',{results});
    });
});

app.get('/register',(req,res,next)=>{
    let msg;
    if(req.query.msg == 'register'){
        msg = "This email address is already registered.";
    }
    res.render('register',{msg});
});

app.post('/registerProcess',(req,res,next)=>{
    //res.json(req.body);
    const hashedPass = bcrypt.hashSync(req.body.password);
    //res.json(hashedPass);

    //Before we insert a new user, we need to make sure they aren't already in the DB
    const checkUserQuery = `SELECT * FROM users WHERE email = ?;`;
    connection.query(checkUserQuery,[req.body.email],(err,results)=>{
        if(err){throw err;}
        if(results.length != 0){ //I.e. If already registered
            res.redirect('/register?msg=register');
        } else { //We have a new user
            const insertUserQuery = `INSERT INTO users (name,email,hash)
                VALUES
                (?,?,?)`;
            connection.query(insertUserQuery,[req.body.name,req.body.email,hashedPass],(err_2,results_2)=>{
                if(err_2){throw err_2;}
                res.redirect('/?msg=resSuccess');
            });
        }
    })
});

app.get('/login',(req,res,next)=>{
    let msg;
    if(req.query.msg == 'noUser'){
        msg = "This email isn't registered in our system. Please try typing it out again or register."
    } else if(req.query.msg == 'badPass'){
        msg = "This password is incorrect. Please try entering again (be wary of case sensitivity)."
    }
    res.render('login',{msg});
});

app.post('/loginProcess',(req,res,next)=>{
    const email = req.body.email;
    const password = req.body.password; //English version of password
    const checkPasswordQuery = `SELECT * FROM users WHERE email = ?;`;
    connection.query(checkPasswordQuery,[email],(err,results)=>{
        if(err){throw err;}
        if(results.length == 0){ //The user isn't in the DB
            res.redirect('/login?msg=noUser');
        } else {
            const passwordsMatch = bcrypt.compareSync(password,results[0].hash);
            if(!passwordsMatch){ //The password doesn't match
                res.redirect('/login?msg=badPass');
            } else {
                //Every single http request (route) is a completely new request
                //Cookies store data in the browser with a key on the server
                //Sessions store data on the server with a key (cookie) in the browser
                req.session.name = results[0].name;
                req.session.email = results[0].email;
                req.session.uid = results[0].id;
                req.session.loggedIn = true;
                res.redirect('/?msg=loginSuccess');
            }
        }
    });
});

app.get('/logout',(req,res,next)=>{
    req.session.destroy();
    res.redirect('/login?msg=loggedOut');
});

console.log("App is listening on Port 4442");
app.listen(4442); //You type in localhost:4442 to access this page