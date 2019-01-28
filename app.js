//This is an Express app, so let's get Express!

const express = require('express'); //This grabs Express
let app = express(); //This makes an Express app
const helmet = require('helmet'); //Gives basic security protection for Express
app.use(helmet()); //Helmets protect bikers and Express apps :^ )
    //app.use() adds Middleware (any function that has access to req and res)

const config = require('./config'); //Grabs the config from the current directory
const mysql = require('mysql'); //Grabs mysql
let connection = mysql.createConnection(config.db); //Create mysql connection to database

//Let's connect!
connection.connect();

//Let's add EJS so we can render
app.set('views','views'); //Picks directory | Arg1: Name of property & Arg2: Name of Folder
app.set('view engine','ejs'); //Sets rendering engine to EJS

//SET UP PUBLIC FOLDER
app.use(express.static('public')); //express.static() is middleware too!

app.get('/',(req,res,next)=>{
    const gpQuery = `SELECT * FROM guineapigs`; //Our SQL query
    connection.query(gpQuery,(err,results)=>{   //Passing the query into our connection
        if(err){throw(err);} //Troubleshooting for errors
        const rand = Math.floor(Math.random() * results.length); //Random number from 0 to results.length
        res.render('index',{    //Renders the index file in views
            guineapig:results[rand], //Populates the query results into the res object
        });
    })
});

app.get('/vote/:value/:id',(req,res,next)=>{
    const value = req.params.value;
    const g_id = req.params.id;
    const insertQuery = `INSERT INTO votes (id,gp_id,score) VALUES (DEFAULT,?,?)`;
    connection.query(insertQuery,[g_id,value],(err,results)=>{
        if(err){throw(err);}
        res.redirect('/');
    });
})

console.log("App is listening on Port 4442");
app.listen(4442); //You type in localhost:4442 to access this page