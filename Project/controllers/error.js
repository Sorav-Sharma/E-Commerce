exports.get404 = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1] === 'true';

    res.render('404', {
        pageTitle: "ERROR 404!!",
        path: "/404",
        isAuthenticated: req.session.user
    })

}
