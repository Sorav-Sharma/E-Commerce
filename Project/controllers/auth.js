const bcrypt = require('bcryptjs');

const User = require('../models/user');


exports.getLogin = (req, res, next) => {
    // const cookieHeader = req.get('Cookie');
    // console.log("HEREEE");
    // console.log(req.session);
    // console.log("HEREEE222");

    // const isLoggedIn = req.session.isLoggedIn === true;
    console.log(req.session.isLoggedIn);

    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[0] === 'true';

    // console.log(isLoggedIn);  // access the value of the "Cookie" header
    res.render('auth/login',
        {
            path: "/login",
            pageTitle: "Login",
            isAuthenticated: false
        });
}


exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        isAuthenticated: false
    });
};

exports.postLogin = (req, res, next) => {
    // authentication is next section

    // req.isLoggedIn = true;
    // res.setHeader('Set-Cookie', 'loggedIn = true ; Max-Age=10');      // this cookie can be checked under APPLICATION tab of developer tools
    // can always search up to see different attribute we can set of a cookie(  expires , Secure , Date , HttpOnly etc) , Often we will use packages to work with cookies

    // This cookie is sent with every request to the server (even after we restart the server , BUT not after browser is closed)
    // this is a session cookie and it will expire when browser is closed

    // User.findById('6596897a828f4ec8b7dee633')
    //     .then((user) => {
    //         req.session.isLoggedIn = true;   // "session" added by the middleware 
    //         req.session.user = user;
    //         req.session.save((err) => {
    //             console.log(err);
    //             res.redirect('/');
    //         });  // usually dont need to do this , only reqd to do this in scenario when we need to make sure session is created before we continue (this avoids premature redirection to non validated user page)
    //     })
    //     .catch((err) => {
    //         console.log(err);
    //     });

    const email = req.body.email;
    const password = req.body.password;
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                return res.redirect('/login');
            }
            bcrypt
                .compare(password, user.password)
                .then((doMatch) => {
                    // result of compare is boolean which can be true/false meaning matched or not , while err is just err in executing this function
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    res.redirect("/login");
                })
                .catch((err) => {
                    console.log(err);
                    res.redirect('/login');
                });

        })
        .catch((err) => {
            console.log(err);
        });
}
exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    // same email should not be existing
    User.findOne({ email: email })
        .then((userDoc) => {
            if (userDoc) {
                return res.redirect('/signup');
            }
            // bcrypt hash is an asynchronous task , therefor it returns a promise
            return bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({
                        email: email,
                        password: hashedPassword,
                        cart: { items: [] }
                    })
                    return user.save()
                        .then(result => {
                            res.redirect('/login');
                        })
                })
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
}

