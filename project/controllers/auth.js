const crypto = require('crypto')
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const { check } = require('express-validator');
const { validationResult } = require('express-validator');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req, res, next) => {

    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login',
        {
            path: "/login",
            pageTitle: "Login",
            isAuthenticated: false,
            errorMessage: message,
            oldInput: { email: "", password: "" },
            validationErrors: []
        });
}


exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldInput: { email: "", password: "", confirmPassword: "" },
        validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: errors.array()[0].msg,
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: errors.array()
                });
            }
            bcrypt
                .compare(password, user.password)
                .then((doMatch) => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: errors.array()[0].msg,
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: errors.array()
                    });
                })
                .catch((err) => {
                    // console.log(err);
                    res.redirect('/login');
                });

        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}
exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, password: password, confirmPassword: req.body.confirmPassword },
            validationErrors: errors.array()
        });
    }
    // same email should not be existing
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            })
            return user.save()
                .then(result => {
                    transporter.sendMail({
                        to: email,
                        from: 'soravsharma700@gmail.com',
                        subject: 'SignUp Succeeded!',
                        html: "<h1> You successfully signed up ! </h1>"
                    })
                    res.redirect('/login');
                })
        })
}


exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
}


exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    })
}


exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        let redFlag = false;
        User.findOne({ email: req.body.email })
            .then((user) => {
                if (!user) {
                    req.flash('error', 'No Account With That Email found');
                    redFlag = 1;
                    return res.redirect('/reset');
                }
                else {
                    user.resetToken = token;
                    user.resetTokenExpiration = Date.now() + 3600000;      // one hour from now
                    return user.save();
                }
            })
            .then(result => {
                if (!redFlag) {
                    res.redirect('/');
                    transporter.sendMail({
                        to: req.body.email,
                        from: 'soravsharma700@gmail.com',
                        subject: 'Password reset',
                        html: `
                        <p> You requested a password reset </p>
                        <p> Click this <a href = "http://localhost:3000/reset/${token}"> link </a> to set a new password </p>
                        `
                    });
                }
            })
            .catch((err) => {
                console.log(err);
            });
    })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then((user) => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            console.log("HEREE");
            console.log(user);
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body._userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    User.findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
        .then((user) => {
            resetUser = user;
            console.log(user);
            console.log(resetUser);
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
            transporter.sendMail({
                to: resetUser.email,
                from: 'soravsharma700@gmail.com',
                subject: 'Password reset',
                html: `
                <p> Your Password has been Changed </p>
                `
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

}