const getHome = (req,res,next)=>{
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
};

module.exports = getHome;