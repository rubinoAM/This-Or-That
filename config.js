const config = {
    db:{
        host:'127.0.0.1',
        user:'x',
        password:'x',
        database:'wildOrNot',
    },
    sessionSecret:'thisOrThat321',
};

module.exports = config; //module.exports can only export one thing at a time
                         //That's why we're putting everything in the one config object!