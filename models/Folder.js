const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    name: {
        type: String,
        required: true,
        minLength: 2,
        trim: true
    },
    path:{
        type:String,
        required:true
    },
    isStarred:{
        type:Boolean,
        default:false
    }
   
}, { timestamps: true });

module.exports = mongoose.model('folder', FolderSchema);