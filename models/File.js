const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    original_name: {
        type: String,
        required: true,
    },
    file_id: {
        type: String,
        required: true,
    },
    file_type:{
        type:String,
        required:true,
    },
    path:{
        type:String,
        required:true
    },
    isStarred:{
        type:Boolean,
        default:false
    },
    uploadDate:{
        type:Date,
        default:Date.now
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletionDate: {
        type: Date
    }

}, { timestamps: true });

module.exports = mongoose.model('file', FileSchema);