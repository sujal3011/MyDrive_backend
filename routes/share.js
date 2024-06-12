const express=require('express');
const router=express.Router();
const User=require('../models/User');
const Share=require('../models/Share');
const mongoose = require('mongoose');

// Authentication required: only owner and editor can share the item
// POST:Sharing item
router.post('/', async (req,res)=>{
    const {itemId,itemType,shareWithEmail,permission}=req.body;

    if(!['file','folder'].includes(itemType)){
        return res.status(400).send({error:'Invalid item Type'});
    }

    if(!['view','edit'].includes(permission)){
        return res.status(400).json({success:false,error:'Invalid permission Type'});
    }

    try {
        const shareWithUser = await User.findOne({ email: shareWithEmail });
        if(!shareWithUser){
            return res.status(404).json({success:false,error:'User not found'});
        }
        
        const share=new Share({
            itemId:itemId,
            itemType:itemType,
            sharedWith:shareWithUser._id,
            PermissionStatus:permission
        })
        await share.save();
   
        console.log(share);
        return res.status(201).json({success:true,message:'Item successfully shared'});
    } catch (error) {
        res.status(501).send({success:false,error});
    }
});

//GET:Fetching all items shared with a user
router.get('/:userId', async (req,res)=>{
    const {userId}=req.params.userId;
    try {

        const user=User.findById(userId);
        if(!user){
            return res.status(400).json({success:false,message:"User not found"});
        }

        const sharedItems=Share.find({sharedWith:userId});
        const items=await Promise.all((await sharedItems).map(async (share)=>{
            const model= share.itemType==='file' ? require('../models/File') : require('../models/Folder');
            const item=model.findById(share.itemId);
            return {
                ...item.toObject(),
                sharedWith:share.sharedWith,
                permission:share.PermissionStatus,
                itemType:share.itemType
            }
        }))
      
        return res.status(200).json({success:true,items});
    } catch (error) {
        res.status(501).send({success:false,error});
    }
});

router.get('/item/:itemId/users', async (req,res)=>{
    try {
        const itemId=req.params.itemId;
        const shares=await Share.find({itemId});
        const userIds=shares.map(share=>share.sharedWith);
        const users=await User.find({_id:{$in:userIds}});
        const usersWithPermissions = shares.map(share => {
            const user = users.find(user => user._id.equals(share.sharedWith));
            return {
              _id: user._id,
              email: user.email,
              permission: share.PermissionStatus
            };
        });
        return res.status(200).json({success:true,usersWithPermissions:usersWithPermissions});

    } catch (error) {
        res.status(501).send({success:false,error});
    }
});

router.post('/item/:itemId/updatePermissions', async (req, res) => {
    const { itemType, permissions } = req.body;
    const itemId = req.params.itemId;
  
    try {
      for (const [userId, permission] of Object.entries(permissions)) {
        const permissionStatus = (permission=='Viewer' ? 'view' : 'edit'); 

        if (permission === 'Remove access') {
            await Share.deleteOne({ itemId, sharedWith: userId });
            continue;
        }
        const existingShare = await Share.findOne({ itemId, sharedWith: userId });
  
        if (existingShare) {
          existingShare.PermissionStatus = permissionStatus;
          await existingShare.save();
        } else {
          const newShare = new Share({
            itemId,
            itemType,
            sharedWith: mongoose.Types.ObjectId(userId),
            PermissionStatus: permissionStatus,
          });
  
          await newShare.save();
        }
      }

      res.status(200).json({ success: true, message: 'Permissions updated successfully.' });
    } catch (error) {
      console.error('Error updating permissions:', error);
      res.status(500).json({ success: false, message: 'An error occurred while updating permissions.' });
    }
});



module.exports=router;