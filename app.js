const express = require("express");
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const bodyParser = require("body-parser");
require('dotenv').config();
const cors = require('cors');
const passport=require('passport')

const app = express();

// middlewares

app.use(bodyParser.json());
app.use(methodOverride("_method"));


const mongoURL = process.env.MONGO_URL

// const mongoURL = "mongodb://localhost:27017/MyDrive";


const conn = mongoose.connect(mongoURL,()=>{
    console.log("Successfully connected to mongo");
});


app.use(cors())

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

app.use('/auth',auth);
app.use('/files',files);
app.use('/folders',folders);


const port = 80;

app.listen(port, () => {
    console.log(`The express app is running on port ${port}`);
})
