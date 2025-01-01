const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');
const config = require('../config/database');

module.exports = function (passport) {
    const opts = {};
    //opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = config.secret;

    passport.use(
        new JwtStrategy(opts, (jwt_payload, done) => {
            User.findById(jwt_payload.data._id).then(user => {
                if (user) {
                    done(null, user);
                } else {
                    done(null, false);
                }
            });
        })
    );


    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id).then(user => {
            done(null, user);
        });
    });


    passport.use(
        new GoogleStrategy(
            {
                clientID: 'GOOGLE_CLIENT_ID',
                clientSecret: 'GOOGLE_CLIENT_SECRET',
                callbackURL: '/auth/google/callback'
            },
            (accessToken, refreshToken, profile, done) => {
                registerOrUpdateUser(profile, done);
            }
        )
    );


}





