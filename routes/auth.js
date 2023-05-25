const express = require('express')
const passport=require('passport');
const router = express.Router()
const User = require('../models/User')
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const fetchUser=require('../middleware/fetchUser');
const jwt = require('jsonwebtoken');   //using jwt(JSON web token for authorization)
require('dotenv').config();

const secret_key=process.env.SECRET_KEY


//  ROUTE-1---->Creating a new user (no login required)
router.post('/createUser', [
  body('name', 'The name must be of atleast 3 characters').isLength({ min: 3 }),
  body('email', 'Enter a valid email ').isEmail(),
  body('password', 'The password must be of atleast 6 characters').isLength({ min: 6 }),
], async (req, res) => {
  
  let success=false;

  const errors = validationResult(req);    //validating using express validator
  if (!errors.isEmpty()) {
    return res.status(400).json({ success,errors: errors.array() });
  }

  try{

  let user = await User.findOne({ "email": req.body.email })  //checking if an user with this email already exists
  if (user) {
    return res.status(400).json({ success,"error": "A user with this email address already exists" })
  }
  const salt=await bcrypt.genSalt(10)
  const secPass=await bcrypt.hash(req.body.password,salt)   
  user = await User.create({     
    name: req.body.name,
    email: req.body.email,
    password:secPass,
  })

  const data={
    user:{
      id:user.id
    }
  }

  const token=jwt.sign(data,secret_key)  // using sign function to create the token 

  success=true;

  res.json({success,token})  //returning token to the client

  }catch(err){
    res.status(500).send("Internal server error")  //500 status code means that some unexpected error occured
    console.log(err)
  }


})

//  ROUTE-2----->Loging in existing user using credentials(no login required)
router.post('/login', [
  body('email', 'Enter a valid email ').isEmail(),
  body('password', 'The password cannot be blank').isLength({ min: 1 }),
], async (req, res) => {

  let success=false;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const {email,password}=req.body
  try {
    let user=await User.findOne({email})
    if(!user){
      return res.status(400).json({error:"Please enter correct credentials"})
    }
    const comparePass=await bcrypt.compare(password,user.password);
    if(!comparePass){
      return res.status(400).json({success,error:"Please enter correct credentials"});
    }

    const data={
      user:{
        id:user.id
      }
    }
    const token=jwt.sign(data,secret_key)  // using sign function to create the token 
    success=true;  //success will be true if no error occurs otherwise false
    res.json({success,token})  //returning token to the client
  

  } catch (error) {
    res.status(500).send("Internal server error")
  }
})

// ROUTE-3-----> Getting loggedin user details (Login required)
router.post('/getUser',fetchUser,async (req,res)=>{
  try {
    const userId=req.user.id
    const user=await User.findById(userId).select("-password");  //getting the user through its id but excluding the password field
    res.json(user);
  } catch (error) {
    res.status(500).send("Internal server error")
  }
})


// ROUTE-4 GOOGLE SIGN IN ENDEPOINT
router.get('/google',
  passport.authenticate('google', { scope: ['profile','email'] }));

// ROUTE-5 GOOGLE SIGN IN CALLBACK

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {

    const data={
      user:{
        id:req.user.id
      }
    }

    const token = jwt.sign(data, secret_key); //generating the token 
    res.redirect(process.env.CLIENT_URL+"/redirect?token="+token);
  });

router.get('/logout',(req,res)=>{
  //handle with passport
  res.send("logging out");
})


// ROUTE-4 GITHUB SIGN IN ENDEPOINT
router.get('/github',
  passport.authenticate('github', { scope: ['profile','email'] }));

// ROUTE-5 GITHUB SIGN IN CALLBACK

router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {

    const data={
      user:{
        id:req.user.id
      }
    }

    const token = jwt.sign(data, secret_key); //generating the token 
    res.redirect(process.env.CLIENT_URL+"/redirect?token="+token);
  });

router.get('/logout',(req,res)=>{
  //handle with passport
  res.send("logging out");
})



module.exports = router