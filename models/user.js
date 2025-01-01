const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/database');

//user schema
const Schema = mongoose.Schema({
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String },
    password: { type: String },
    provider: { type: String },
    isSocial: { type: Boolean },
    profileImage : {type : String},
    isActive : {type : Boolean , default : true},
    resetCode: { type: String },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package'},
    package: {
        type: String,
        default: 'trial',
        enum: ["trial", "paid"]
    },
    remainingMembers: {
        type: Number,
        default: 0
    },
    trialExpiry: {
        type: Date,
        default: function () {
            if (this.role === 'globaladmin' && this.package === 'trial') {
                return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days trial
            }
            return undefined;
        }
    },
    purchasedExpiry: {
        type: Date,
        default: function () {
            if (this.role === 'globaladmin' && (this.package === 'package1' || this.package === 'package2')) {
                return new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days for purchased packages
            }
            return undefined;
        }
    },
    role: { type: String, 
        default: "globaladmin",
        enum:["superadmin","globaladmin"]
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







