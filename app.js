const express = require("express");
const path = require('path');

const passport=require('passport');
const session = require('express-session');
require("./config/passport-setup");

const mongoose = require('mongoose');
const methodOverride = require('method-override');
const bodyParser = require("body-parser");
require('dotenv').config();
const cors = require('cors');

const app = express();

app.use(cors())

//using passport and express-session
app.use(session({ secret: process.env.SESSION_SECRET })); // session secret
app.use(passport.initialize());
app.use(passport.session())

// middlewares

app.use(bodyParser.json());
app.use(methodOverride("_method"));


const mongoURL = process.env.MONGO_URL


const conn = mongoose.connect(mongoURL,()=>{
    console.log("Successfully connected to mongo");
});



app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, auth-token, Referer, User-Agent, Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Preflight', true)

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    
    next();
})


// app.use(express.json());

app.get('/', (req, res) => {
    res.send("Hello,Welcome to MyDrive");
})

const auth=require('./routes/auth')
const files=require('./routes/files');
const folders=require('./routes/folders');
const share=require('./routes/share');

app.use('/auth',auth);
app.use('/files',files);
app.use('/folders',folders);
app.use('/share',share);



const PORT=process.env.PORT || 80

app.listen(PORT, () => {
    console.log(`The express app is running on port ${PORT}`);
})
