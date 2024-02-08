/*


*/


const Product = require('../models/product'); // importing model
const Order = require('../models/order');



exports.getProducts = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1] === 'true';

    // find() method works differently for mongoose than mongoDB , it does not give us a cursor (.cursor  can be used if we want cursor)
    // use cursor for large amounts of data
    Product.find()
        .then(products => {
            res.render('shop/product-list',
                {
                    prods: products,
                    pageTitle: "All Products",
                    path: "/products",
                    isAuthenticated: req.session.user
                });
        }).catch((err) => {
            console.log(err);
        });
}

exports.getProduct = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1] === 'true';

    const prodId = req.params.productId;
    // Product is a mongoose model and it already have a "findById" method , so its already working 
    //  not only that we can also send string as an arguement and mongoose automatically converts it into BSON object
    Product.findById(prodId)
        .then((prod) => {
            res.render('shop/product-detail', {
                product: prod,
                pageTitle: prod.title,
                path: "/products",
                isAuthenticated:  req.session.user

            })
        })
        .catch((err) => { console.log(err) })
}

exports.getIndex = (req, res, next) => {
    // const cookieHeader = req.get('Cookie');
    // const isLoggedIn = cookieHeader ? cookieHeader.split(';')[0].trim().split('=')[0] === 'true' : false;

    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1]==='true';


    // findAll can be configured with some options, but for now proceed without any restricitions on fetched product
    Product.find()
        .then(products => {
            res.render('shop/index',
                {
                    prods: products,
                    pageTitle: "Shop",
                    path: "/shop/index",
                    isAuthenticated:  req.session.user

                });
        }).catch((err) => {
            console.log(err);
        });
}

exports.getCheckout = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1] === 'true';

    res.render('shop/checkout', {
        path: '/checkout',

        pageTitle: 'Checkout'
    })
}

exports.getCart = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1] === 'true';

    req.user
        .populate('cart.items.productId')
        .then((user) => {
            // console.log(user.cart.items);
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products,
                isAuthenticated:  req.session.user

            })
        })
        .catch((err) => {
            console.log(err);
            res.redirect('/cart');
        });
    // view also changed as the top object will not have title etc , it will be in productId 
    /*
          {
            productId: {
              _id: new ObjectId('6595b2edbf91a71d8e10d998'),
              title: ' fourth',
              price: 222,
              description: 'updated via mongoose',
              imageUrl: ' https://cdn.mos.cms.futurecdn.net/GfzwEBy5XYUZnfV5tkZ7dH-1200-80.jpg',
              __v: 0
            },
            quantity: 2,
            _id: new ObjectId('65969804dc89ceb2a611354a')
          }
    */

}

exports.postCart = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1] === 'true';

    const prodId = req.body.productId;

    Product.findById(prodId)
        .then((product) => {
            return req.user.addToCart(product);
        })
        .then(result => {
            // console.log(result);
            res.redirect('/cart');
        })
        .catch((err) => {
            console.log(err);
        });

}

exports.postCartDeleteProduct = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1] === 'true';

    const prodId = req.body.productId;
    // console.log("HERE  !!!!" , prodId);
    req.user.deleteItemFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => { console.log(err); });
}


exports.getOrders = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1] === 'true';

    Order.find({ 'user.userId': req.session.user._id })  // all orders that belong to that user
        .then((orders) => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders,
                isAuthenticated:  req.session.user

            })
        })
        .catch(err => console.log(err));
}



exports.postOrder = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[0].trim().split('=')[1] === 'true';

    req.session.user
        .populate('cart.items.productId')
        .then((user) => {
            // console.log(user.cart.items);
            // NOTE : products have all data in product_id field , due to populating method [see above, getCart() method ]
            const products = user.cart.items.map(i => {
                return {
                    quantity: i.quantity,
                    // i.productId is an object with a lot of meta data with it(which we dont see by console logging it , ._doc we get access to just the data )
                    // and using the spread operator we pull all that data and store that in the new object
                    product: { ...i.productId._doc }
                }
            });
            const order = new Order({
                user: {
                    name: req.user.name,
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
        .catch(err => console.log(err));

    // res.redirect('/orders')
}