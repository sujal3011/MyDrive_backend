const passport=require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
require('dotenv').config();
const User = require('../models/User');

passport.serializeUser((user, cb)=> {
  cb(null, user)
})

passport.deserializeUser( async (id, cb)=> {
  const user = await User.findById(id)
  cb(null, user)
})


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    // passReqToCallback:true,
    profileFields: ['emails']

  }, async (accessToken, refreshToken, profile, cb)=> {
    // console.log(profile);
    const user = await User.findOne({ email : profile._json.email });
    if(user){

      // User is already present in the database
      return cb(null,user);
    }
    else{
      //The user is not present in the database so creating a new user
      let user = await User.create({
        name:profile.displayName,
        email:profile.emails[0].value,
      })

      return cb(null,user);
    } 
  }
));


passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
  profileFields: ['emails']
},
async (accessToken, refreshToken, profile, done) =>{
    // console.log(profile);
    const user = await User.findOne({ email : profile._json.email });
    if(user){

      // User is already present in the database
      return cb(null,user);
    }
    else{
      //The user is not present in the database so creating a new user
      let user = await User.create({
        name:profile.displayName,
        email:profile.emails[0].value,
      })

      return cb(null,user);
    }
}
));