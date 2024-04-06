exports.get404 = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1] === 'true';

    res.status(404).render('404', {
        pageTitle: "ERROR 404!!",
        path: "/404",
        isAuthenticated: req.session.user
    })

}
exports.get500 = (req, res, next) => {
    res.status(500).render('500', {
        pageTitle: "ERROR!!",
        path: "/500",
        isAuthenticated: req.session.user
    })

}
