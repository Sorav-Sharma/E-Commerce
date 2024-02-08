const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        items: [{
            productId: {
                type: Schema.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }]
    }
});

userSchema.methods.addToCart = function (product) {
    // this function has to be defined like this so that "this" refers to schema and nothing else

    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() == product._id.toString();     // product._id is technically not a string even though we can use it as one
        // NOTE : We can directly delete some data from COMPASS , making development easier
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        // already exist
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    }
    else {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity
        })
    }

    const updatedCart = {
        items: updatedCartItems
    }
    this.cart = updatedCart;
    return this.save();
}

userSchema.methods.deleteItemFromCart = function (productId) {
    const updatedCartItems = this.cart.items.filter(item => { return item.productId.toString() != productId.toString() });
    this.cart.items = updatedCartItems;
    return this.save();
}


userSchema.methods.getCart = function () {

    return db.collection('products')
        .find({ _id: { $in: productIds } }).toArray()
        .then(products => {
            // we also need to get quantity
            return products.map(p => {
                // "this" will refer to the class and not "p"    : usecase of arrow functions
                return {
                    ...p,
                    quantity: this.cart.items.find(i => {
                        return i.productId.toString() == p._id.toString();
                    }).quantity
                }
            })
        })
}

userSchema.methods.clearCart = function () {
    this.cart = { items: [] };
    return this.save();
};


module.exports = mongoose.model('User', userSchema);

// const getDb = require('../util/database').getDb;
// const mongodb = require('mongodb');
// const { get } = require('../routes/admin');

// const ObjectId = mongodb.ObjectId;

// class User {
//     constructor(username, email, cart, id) {
//         this.name = username;
//         this.email = email;
//         this.cart = cart;  // {items : {}}
//         this._id = id;

//     }
//     save() {
//         const db = getDb();

//         return db.collection('users').insertOne(this);
//     }

//     getCart() {
//         //  NOTE : get Cart should work for users who have a cart , MONGO DB way of working , no gurantee there exists a cart collection for this user

//         const db = getDb();
//         const productIds = this.cart.items.map(i => {
//             return i.productId;
//         })

//         // special mongoDB syntax , gives a cursor to all the matching products
//         return db.collection('products')
//             .find({ _id: { $in: productIds } }).toArray()
//             .then(products => {
//                 // we also need to get quantity
//                 return products.map(p => {
//                     // "this" will refer to the class and not "p"    : usecase of arrow functions
//                     return {
//                         ...p,
//                         quantity: this.cart.items.find(i => {
//                             return i.productId.toString() == p._id.toString();
//                         }).quantity
//                     }
//                 })
//             })
//     }

//     addToCart(product) {

//     }

//     deleteItemFromCart(productId) {

//     }

//     addOrder() {
//         const db = getDb();

//         return this.getCart()
//             .then(products => {
//                 const order = {
//                     items: products,
//                     user: {
//                         // Instead of relating user with order (by just adding user_id ,we do this as , once an order is placed we should not we worried about user changing its name/email)
//                         // Also Cart only had productIds, we can store some extra
//                         _id: new ObjectId(this._id),
//                         name: this.name,
//                     }
//                 }
//                 return db.collection('orders').insertOne(order);
//             })
//             .then(result => {
//                 this.cart = { items: [] };
//                 return db.collection('users')
//                     .updateOne({ _id: new ObjectId(this._id) },
//                         { $set: { cart: { items: [] } } });
//             })
//     }


//     static findById(userId) {
//         const db = getDb();
//         // if we are sure we will find just one document , we can use findOne , this does not return a cursor
//         return db.collection('users')
//             .findOne({ _id: new ObjectId(userId) });
//     }
// };

// module.exports = User;