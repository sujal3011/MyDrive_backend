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
