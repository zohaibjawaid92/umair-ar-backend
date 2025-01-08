const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database');

//user schema
const Schema = mongoose.Schema({
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type: String, 
        default: "globaladmin",
        enum:["globaladmin"]
    }
});

const User = module.exports = mongoose.model('User', Schema);

module.exports.getUserById = function (id, callback) {
    // User.findById(id,callback);

    User.findById(id)
        .then(user => {
            if (user) {
                return user;
            }
            return false;
        })
        .catch(error => error);

}
module.exports.getUserByUsername = function (email, callback) {
    const query = { email: email }
    User.find(query, callback);

}

module.exports.comparePassword = function (candidatePassword, hash, callback) {
    bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
        if (err) throw err;
        callback(null, isMatch);
    });
}







