const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');

const router = express.Router();
router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter valid email address')
            .normalizeEmail(),
        body('password', 'Password is not valid')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
    ], authController.postLogin);

const User = require('../models/user');

router.post('/signup',
    [check('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please Enter Valid Email')
        .custom((value, { req }) => {
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('Email exists already, please pick a different one')
                    }
                })
        }),
    body('password', 'please enter a password with only numbers and text having at least 5 length')
        .trim()
        .isLength({ min: 5 })
        .isAlphanumeric(),
    body('confirmPassword').trim().custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords have to match !');
        }
        return true;
    })
    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
