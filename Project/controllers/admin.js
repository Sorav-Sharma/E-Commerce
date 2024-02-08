const Product = require('../models/product'); // importing model from product model

exports.getAddProduct = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1]==='true';
    if (!req.session.isLoggedIn) {

        return res.redirect('/login')
    }
    res.render('admin/edit-product',
        {
            pageTitle: "ADD PRODUCT",
            path: "/admin/add-product",
            editing: false,
            isAuthenticated: req.session.user
        });
}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;

    const product = new Product({
        title: title,
        price: price,
        imageUrl: imageUrl,
        description: description,
        userId: req.session.user._id
    });

    product.save()
        .then((result) => {
            // this save() method is defined by mongoose itself (in mongoDb section we defined save() method in product model)

            console.log("SUCCESFULLY ADDED");
            res.redirect('/admin/products');
        }).catch((err) => {
            console.log(err);
        });
        
}

exports.getEditProduct = (req, res, next) => {
    // URL : /12345?edit=true&title=new
    const editMode = req.query.edit;  // if opened in edit mode : "true" is stored in editMode

    //redundent : as we are redirecting to /edit-product/:productId  , we must be here to edit
    if (!editMode) {
        return res.redirect('/');
    }

    // now to populate we need to get the product
    // as we have dynamic segment of productId we can get it here
    const prodId = req.params.productId;

    // below function is automatically generated by sequelize
    Product.findById(prodId)
        .then((prod) => {
            if (!prod) {
                return res.redirect('/');
            }
            res.render('admin/edit-product',
                {
                    pageTitle: "EDIT PRODUCT",
                    path: "/admin/edit-product",
                    editing: editMode,
                    product: prod,
                    isAuthenticated: req.session.user
                });
        })
        .catch((err) => {
            console.log(err);
        })
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageUrl = req.body.imageUrl;
    const updatedDesc = req.body.description;

    Product.findById(prodId)
        .then((product) => {
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.imageUrl = updatedImageUrl;
            product.description = updatedDesc;

            // product from findById is not a javascript object but rather full mongoose object with all its method like save
            // and if we call save on an existing object it will automatically just save the changes and not add new product

            return product.save();
        })
        .then(result => {
            console.log("UPDATED PRODUCT");
            res.redirect('/admin/products');
        })
        .catch((err) => {
            console.log(err);
        });
}

exports.getProducts = (req, res, next) => {
    Product.find()
        // .select('title price -_id')      // select is used to select the fields we want , (_id is always included if not excluded manualy)
        // .populate('userId', 'name')      // path what you want to populate
        // Therefor we can automatically POPULATE RELATED data (with the help of mongoose) ,also select which data we want (in main docu and also in populated document)
        .then(products => {

            // console.log(products); // upon use of populate we see product is associated with not just the userId but the whole user model
            res.render('admin/products',
                {
                    prods: products,
                    pageTitle: "Admin Products",
                    path: "/admin/products",
                    isAuthenticated: req.session.user
                });
        }).catch((err) => {
            console.log(err);
        });
}

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    // just type 'findBy' and see the list of available functions provided by mongoose
    Product.findByIdAndDelete(prodId)
        .then(() => {
            console.log("Deleted Succesfully");
            res.redirect('/admin/products');
        })
        .catch((err) => {
            console.log(err);
        });
}
