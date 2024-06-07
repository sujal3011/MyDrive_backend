const mongoose=require('mongoose');

const ShareSchema=new mongoose.Schema({
    itemId:{type:mongoose.Schema.Types.ObjectId,required:true},
    itemType:{type:String,enum:['file','folder'],require:true},
    sharedWith:{type:mongoose.Schema.Types.ObjectId,ref:'user',required:true},
    PermissionStatus:{type:String,enum:['view','edit'],required:true},
},{ timestamps: true });

module.exports=mongoose.model('share',ShareSchema);