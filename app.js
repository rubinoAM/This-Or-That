//This is an Express app, so let's get Express!
/*
         _  _
        (o)(o)--.
         \../ (  )
         m\/m--m'`--.

*/

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
        res.render('index',{    //Renders the index file in views
            guineapigs:results, //Populates the query results into the res object
        });
    })
});

console.log("App is listening on Port 4442");
app.listen(4442); //You type in localhost:4442 to access this page