const Product = require('../models/product');
const mongoose = require('mongoose');
const { check } = require('express-validator');
const { validationResult } = require('express-validator');
const fileHelper = require('../util/file')
exports.getAddProduct = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login')
    }
    res.render('admin/edit-product',
        {
            pageTitle: "ADD PRODUCT",
            path: "/admin/add-product",
            hasErrors: false,
            errorMessage: null,
            editing: false,
            isAuthenticated: req.session.user
        });
}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;

    const price = req.body.price;
    const description = req.body.description;
    if (!image) {

        // multer rejected this file
        return res.status(422).render('admin/edit-product',
            {
                pageTitle: "ADD PRODUCT",
                path: "/admin/add-product",
                editing: false,
                hasErrors: true,
                errorMessage: "Attached File is not an image.",
                product: {
                    title: title,
                    price: price,
                    description: description
                },
                isAuthenticated: req.session.user
            });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product',
            {
                pageTitle: "ADD PRODUCT",
                path: "/admin/add-product",
                editing: false,
                hasErrors: true,
                errorMessage: errors.array()[0].msg,
                product: {
                    title: title,
                    price: price,
                    description: description
                },
                isAuthenticated: req.session.user
            });
    }
    const imageUrl = image.path;

    const product = new Product({
        // _id: new mongoose.Types.ObjectId('65d0be8422f2cba6cc71d8e0'),
        title: title,
        price: price,
        imageUrl: imageUrl,
        description: description,
        userId: req.session.user._id
    });

    product.save()
        .then((result) => {
            console.log("SUCCESFULLY ADDED");
            res.redirect('/admin/products');
        }).catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
       
        });

}

exports.getEditProduct = (req, res, next) => {
    // URL : /12345?edit=true&title=new
    const editMode = req.query.edit; 
    if (!editMode) {
        return res.redirect('/');
    }

    // as we have dynamic segment of productId we can get it here
    const prodId = req.params.productId;

    Product.findById(prodId)
        .then((prod) => {
            if (!prod) {
                return res.redirect('/');
            }
            console.log(prod);
            res.render('admin/edit-product',
                {
                    pageTitle: "EDIT PRODUCT",
                    path: "/admin/edit-product",
                    hasErrors: false,
                    errorMessage: null,
                    editing: editMode,
                    product: prod,
                    isAuthenticated: req.session.user
                });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;
    const errors = validationResult(req);


    if (!errors.isEmpty()) {

        return res.status(422).render('admin/edit-product',
            {
                pageTitle: "ADD PRODUCT",
                path: "/admin/edit-product",
                editing: true,
                hasErrors: true,
                errorMessage: errors.array()[0].msg,
                product: {
                    title: updatedTitle,
                    price: updatedPrice,
                    description: updatedDesc
                },
                isAuthenticated: req.session.user
            });
    }

    Product.findById(prodId)
        .then((product) => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }
            product.title = updatedTitle;
            product.price = updatedPrice;

            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            product.description = updatedDesc;


            return product.save()
                .then(result => {
                    console.log("UPDATED PRODUCT");
                    res.redirect('/admin/products');
                })
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getProducts = (req, res, next) => {
    Product.find({ userId: req.user._id })
        .then(products => {

            res.render('admin/products',
                {
                    prods: products,
                    pageTitle: "Admin Products",
                    hasErrors: false,
                    errorMessage: null,
                    path: "/admin/products"
                });
        }).catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}



exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    Product.findById(prodId).then((product) => {
        if (!product) {
            return next(new Error('Product not found.'));
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then((prodd) => {
        if (prodd.deletedCount > 0) {
            console.log("Deleted Succesfully");
        }
        else {
            console.log("NOT ALLOWED!!");
        }
    })
    .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
    return res.redirect('/admin/products');
}
