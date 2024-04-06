const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorController = require('./controllers/error');
const multer = require('multer');
const fs = require('fs');


const User = require('./models/user');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './images';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        //  File name cannot have : , | , < > , \ /

        const timestamp = new Date().toISOString().replace(/:/g, '_');
        const filename = timestamp + '-' + file.originalname;
        cb(null, filename);
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    }
    else {
        // multer dont store the file , we will print undefined (req.file) in admin controller
        cb(null, false);
    }
}

app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

app.set('view engine', 'ejs');

app.set('views', 'views');


// below mentioned folders will be handled by express , all heavy lifting is done BTS by express
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

const MONGODB_URI = 'mongodb+srv://sorav:O7Jbhz66di5kk4NR@cluster0.je8p5gc.mongodb.net/shop';

const store = new MongoDBStore({
    uri: MONGODB_URI,   // uniform resource identifier
    collection: 'sessions'
})


app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store
    })
);

const csrfProtection = csrf(); 
app.use(csrfProtection);   
app.use(flash());


app.use((req, res, next) => {

    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then((user) => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch((err) => {
            next(new Error(err));
        });
});


app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    })
})

mongoose.connect(MONGODB_URI)
    .then((result) => {
        app.listen(3000);
        console.log("CONNECTED !!!");
    })
    .catch((err) => {
        console.log(err);
    });