/*
    Intro: 
        user : OPTIONS -> view products , create/manage products , Place orders
        not all these actions are available to every user (may not be logged in[called anonymous users])
        // Every user (may not be logged in) can VIEW PRODUCTS  , but not create/place

    252 : IMPLEMENTATION    
        Email & Password are matched (And then the session is loaded (if signing up then session created))

        NOTE : Each request is independent and session is the one which connects them
        LOGIN REQUEST is sent to server , and server sets up the session for this user and send in response Cookie (having session ID) which is further sent with every req of that user , thus then server is able to user that cookie to associated user to already existing session
    
    253 : RESOURCE
    
    254 : Authentication Flow
        user Schema changed , password added and name field removed 

    255 : ENCRYPTING PASSWORD
        we cannot store password as it is , as if database gets comprimised , whole system is doomed[we see in compass that each user has a password field , plain password is present , we want it to be stored in encrypted password]
        npm install --save bcryptjs
        in auth controller , bcrypt is used
    257 : ADDING SIGN IN FUNCTIONALITY / PROTECTING ROUTES
            postlogin functionality changed
            we see if we just use /admin/add-product etc we can still reach page without logging in
            We need to protect our Routes

*/

const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorController = require('./controllers/error');


const User = require('./models/user');
app.use(bodyParser.urlencoded({ extended: false }));
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

app.set('view engine', 'ejs');

app.set('views', 'views');


app.use(express.static(path.join(__dirname, 'public')));


const MONGODB_URI = 'mongodb+srv://sorav:O7Jbhz66di5kk4NR@cluster0.je8p5gc.mongodb.net/shop';

const store = new MongoDBStore({
    uri: MONGODB_URI,   // uniform resource identifier
    collection: 'sessions'
})


// NOTE:  Below middleware automatically adds SESSION COOKIE , we can configure some attributes for the cookie too in following function
app.use(
    session({
        secret: 'my secret',
        resave: false,   // session not changed on every response , only if something changed
        saveUninitialized: false,
        store: store
    })
);
//  SESSION COOKIE : used to implement sessions in ( note : deleted when we close browser) it identifies the user(running instance) 


app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then((user) => {
            // by the time we reach here, we will be having our session data loaded(ABOVE , it automatically looks for a session cookie , if it find one in DB , it loads data from there)
            // when we were fetching user from the session (stored in DB) , we were getting plain data and not a whole object with all functionalities provided by mongoose
            req.user = user;
            next();
        })
        .catch((err) => {
            console.log(err);
        });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);



mongoose.connect(MONGODB_URI)
    .then((result) => {
        app.listen(3000);
        console.log("CONNECTED !!!");
    })
    .catch((err) => {
        console.log(err);
    });