//This is an Express app, so let's get Express!

const express = require('express'); //This grabs Express
let app = express(); //This makes an Express app
const helmet = require('helmet'); //Gives basic security protection for Express
const bcrypt = require('bcrypt-nodejs');
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

//Get BODY PARSER & URLENCODE Middleware
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.get('/',(req,res,next)=>{
    const gpQuery = `SELECT * FROM guineapigs`; //Our SQL query
    connection.query(gpQuery,(err,results)=>{   //Passing the query into our connection
        if(err){throw(err);} //Troubleshooting for errors

        //Check for msg query string
        let msg;
        if(req.query.msg){
            msg = 'You have successfully registered!';
            console.log(msg);
        }

        const rand = Math.floor(Math.random() * results.length); //Random number from 0 to results.length
        res.render('index',{    //Renders the index file in views
            guineapig:results[rand], //Populates the query results into the res object
            msg
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

console.log("App is listening on Port 4442");
app.listen(4442); //You type in localhost:4442 to access this page