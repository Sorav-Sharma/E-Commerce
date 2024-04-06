
const Product = require('../models/product'); // importing model
const Order = require('../models/order');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit')
const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
    let pp = parseInt(req.query.page);
    if (!pp) {
        pp = 1;
    }
    const page = pp;
    let totalItems;
    Product.find().countDocuments().then((numProducts) => {
        totalItems = numProducts;
        return Product.find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)
    })

        .then(products => {
            res.render('shop/index',
                {
                    prods: products,
                    pageTitle: "All Products",
                    path: "/products",
                    currentPage: page,
                    hasNextPage: (ITEMS_PER_PAGE * (page) < totalItems),
                    hasPreviousPage: page > 1,
                    nextPage: page + 1,
                    prevPage: page - 1,
                    lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                    csrfToken: req.csrfToken()
                });
        }).catch((err) => {
            console.log(err);
        });
}

exports.getProduct = (req, res, next) => {

    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((prod) => {
            res.render('shop/product-detail', {
                product: prod,
                pageTitle: prod.title,
                path: "/products"

            })
        })
        .catch((err) => { console.log(err) })
}

exports.getIndex = (req, res, next) => {
    let pp = parseInt(req.query.page);
    if (!pp) {
        pp = 1;
    }
    const page = pp;
    let totalItems;
    Product.find().countDocuments().then((numProducts) => {
        totalItems = numProducts;
        return Product.find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)
    })

        .then(products => {
            res.render('shop/index',
                {
                    prods: products,
                    pageTitle: "Shop",
                    path: "/shop/index",
                    currentPage: page,
                    hasNextPage: (ITEMS_PER_PAGE * (page) < totalItems),
                    hasPreviousPage: page > 1,
                    nextPage: page + 1,
                    prevPage: page - 1,
                    lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                    csrfToken: req.csrfToken()
                });
        }).catch((err) => {
            console.log(err);
        });
}

exports.getCheckout = (req, res, next) => {

    res.render('shop/checkout', {
        path: '/checkout',

        pageTitle: 'Checkout'
    })
}

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then((user) => {
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products

            })
        })
        .catch((err) => {
            console.log(err);
            res.redirect('/cart');
        });

}

exports.postCart = (req, res, next) => {

    const prodId = req.body.productId;

    Product.findById(prodId)
        .then((product) => {
            return req.user.addToCart(product);
        })
        .then(result => {
            res.redirect('/cart');
        })
        .catch((err) => {
            console.log(err);
        });

}

exports.postCartDeleteProduct = (req, res, next) => {

    const prodId = req.body.productId;
    req.user.deleteItemFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => { console.log(err); });
}


exports.getOrders = (req, res, next) => {

    Order.find({ 'user.userId': req.session.user._id })  // all orders that belong to that user
        .then((orders) => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders
            })
        })
        .catch(err => console.log(err));
}



exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then((user) => {
            const products = user.cart.items.map(i => {
                return {
                    quantity: i.quantity,
                    product: { ...i.productId._doc }
                }
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user._id
                },
                products: products
            })
            order.save();
        })
        .then(result => {

            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            console.log(err)
        })
};


exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;

    Order.findById(orderId)
        .then((order) => {
            if (!order) {
                return next(new Error("No order found!"));
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error("Unauthorized"));
            }
            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);

            const pdfDoc = new PDFDocument();

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');

            pdfDoc.pipe(fs.createWriteStream(invoicePath)); // start making the file
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text('Invoice', { underline: true })

            pdfDoc.text('______________________________');
            let total_price = 0;
            order.products.forEach(prod => {
                total_price += prod.quantity * prod.product.price;
                pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
            })

            pdfDoc.fontSize(22).text('Total Price --> $' + total_price);


            pdfDoc.end();
        })
        .catch((err) => {
            next(err);
        });


}