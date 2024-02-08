const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Some kind of schema should be there, along with flexibility 
const productSchema = new Schema({
    title : {
        type : String,
        required : true
    },
    price:{
        type: Number,
        required : true
    },
    description: {
        type : String,
        required: true
    },
    imageUrl : {
        type : String,
        required : true
    },
    userId:{
        type: Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
});

// below is used to connect a schema/blueprint with a name , which we can use to work with database
module.exports = mongoose.model('Product',productSchema);    // this is what we will work with



// const getDb = require('../util/database').getDb;
// // 188
// const mongodb = require('mongodb');

// class Product {
//     constructor(title, price, description, imageUrl, id, userId) {
//         this.title = title;
//         this.price = price;
//         this.description = description;
//         this.imageUrl = imageUrl;
//         this._id = id ? new mongodb.ObjectId(id) : null;  // id parameter is optional (used to make edit method work)
//         this.userId = userId;
        
//     }

//     save() {
//         const db = getDb();

//         let dbOp;

//         if (this._id) {
//             // UPDATE

//             // updateOne takes 2 arguement , one is a filter and second is the updation description
//             dbOp = db.collection('products').updateOne({ _id: this._id }, { $set: this });
//         }
//         else {
//             dbOp = db.collection('products').insertOne(this);
//         }
//         // ALL these functions can be read at : MONGO DB CRUD OPERATIONS

//         // next level after database is Collection
//         return dbOp
//             .then((result) => {
//                 // console.log("HERE 1");
//                 console.log(result);
//             })
//             .catch((err) => {
//                 console.log(err);
//             });
//     }
//     static fetchAll() {
//         const db = getDb();
//         // Find method can also be configured to act as filter out method (like we did before {where: {id:2}})
//         // NOTE: find() does not return a PROMISE rather it returns a CURSOR(which is a pointer to the result set of a query)
//         // (allows to go through elements step by step , as find can fetch millions of documents we can just set/move cursor)  
//         // Here for learning as products are low , we are using toArray , its not to be used in real practice

//         return db.collection('products')
//             .find()
//             .toArray()
//             .then(products => {
//                 // console.log(products);
//                 return products
//             })
//             .catch(err => { console.log(err); });
//     }
//     static findById(prod_Id) {
//         const db = getDb();
//         // Also , we need to make sure id is added to URL upon clicking detail button
//         // find gices a cursor , next is used to get 

//         return db.collection('products')
//             .find({ _id: new mongodb.ObjectId(prod_Id) })
//             .next()        // for this case its the end (as only one such id)
//             .then((product) => {
//                 // console.log(product);
//                 return product;
//             })
//             .catch((err) => {
//                 console.log(err);
//             });
//     }

//     static deleteById(prodId) {
//         const db = getDb();
//         // these functions can be read from their documentation
//         // mongodb will delete the first documnet meeting the condition in the brackets
//         return db.collection('products').deleteOne({ _id: new mongodb.ObjectId(prodId) })
//             .then((result) => {
//                 console.log('DELETED SUCCESSFULLY !!');
//             })
//             .catch((err) => {
//                 console.log(err);
//             });

//     }
// };


// module.exports = Product; // We export the class