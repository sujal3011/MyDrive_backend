const express = require("express");
const fetchUser = require("../middleware/fetchUser");
const router = express.Router();
const Folder = require("../models/Folder");
const { body, validationResult } = require('express-validator');


// ROUTE-1---->getting all the folders of the user of the particular path

router.get('/getfolders', fetchUser, async (req, res) => {
    try {
        const {query}=req.query;
        const regexPattern= new RegExp(query,'i');
        const folders = await Folder.find({ name: { $regex: regexPattern },user: req.user.id, path:req.header("path") });
        res.json(folders);
    } catch (error) {
        res.status(500).send("Internal server error")
    }
})

// ROUTE-2---->adding a folder

router.post('/addfolder', fetchUser, [
    body('name', 'Enter a valid name').isLength({ min: 2 }),
], async (req, res) => {
    try {
        const { name } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const folder = new Folder({
            name, user: req.user.id,path:req.header("path")
        })
        const savedFolder = await folder.save();
        res.json(savedFolder);


    } catch (error) {
        res.status(500).send("Internal server error");
    }
})

//ROUTE-3----->updating a folder

router.put('/updatefolder/:id', fetchUser, async (req, res) => {

    const { name } = req.body;

    try {

        const newFolder = {};
        if (name) { newFolder.name = name };

        let folder = await Folder.findById(req.params.id);

        if (!folder) {
            return res.status(404).send("Not found");
        }

        if (req.user.id !== folder.user.toString()) {
            return res.status(401).send("Not allowed");
        }

        folder = await Folder.findByIdAndUpdate(req.params.id, { $set: newFolder }, { new: true });
        res.json(folder);
    } catch (error) {
        res.status(500).send("Internal server error");
    }
})

router.put('/starFolder/:id',fetchUser, async (req, res) => {

    try {

        let folder = await Folder.findById(req.params.id);
        if (!folder) {
            return res.status(404).send("Not found");
        }

        if (req.user.id !== folder.user.toString()) {
            return res.status(401).send("Not allowed");
        }

        const updatedFolder = await Folder.findByIdAndUpdate({ _id: req.params.id }, { isStarred: true });
        res.json(updatedFolder);

    } catch (error) {
        res.status(500).json(error);
    }

})

router.put('/removestarFolder/:id',fetchUser, async (req, res) => {

    try {

        let folder = await Folder.findById(req.params.id);
        if (!folder) {
            return res.status(404).send("Not found");
        }

        if (req.user.id !== folder.user.toString()) {
            return res.status(401).send("Not allowed");
        }
        const updatedFolder = await Folder.findByIdAndUpdate({ _id: req.params.id },{ isStarred: false });
        res.json(updatedFolder);

    } catch (error) {
        res.status(500).json(error);
    }

})


router.get('/fetchstarredfolders',fetchUser, async (req, res) => {
    try {
        const {query}=req.query;
        const regexPattern= new RegExp(query,'i');
        const starredFolders = await Folder.find({ user: req.user.id,isStarred: true,name: { $regex: regexPattern } });
        res.json(starredFolders);

    } catch (error) {
        res.status(500).json(error);
    }
})

// TO DO
//CREATING ENDPOINT FOR DELETING FOLDER

router.delete('/deletefolder/:id', fetchUser, async (req, res) => {

    try {
        let folder = await Folder.findById(req.params.id);

        if (!folder) {
            return res.status(404).send("Not found");
        }

        if (req.user.id !== folder.user.toString()) {
            return res.status(401).send("Not allowed");
        }

        folder = await Folder.findByIdAndDelete(req.params.id);
        res.json(folder);
    } catch (error) {
        res.status(500).send("Internal server error");
    }
})

router.put('/bin/move/:id',async (req,res)=>{

    const id=req.params.id;

    try {
        
        const folder=await Folder.findByIdAndUpdate(id,{
            isDeleted:true,
            deletionDate:new Date(),
        });
    
        if(!folder){
            return res.status(404).json({success:false,error:"Folder not found"});
        }
        return res.status(200).json({success:true,message:"Folder moved to bin successfully"});
    } catch (error) {
        return res.status(500).json({success:false,error:"Internal Server Error"});
    }

})

router.put('/bin/restore/:id',fetchUser,async (req,res)=>{

    try {

        let folder = await Folder.findById(req.params.id);
        if (!folder) {
            return res.status(404).send("Not found");
        }

        if (req.user.id !== folder.user.toString()) {
            return res.status(401).send("Not allowed");
        }
        const updatedFolder = await Folder.findByIdAndUpdate({ _id: req.params.id },{ isDeleted: false });
        return res.status(200).json({success:true,message:"Folder restored from bin successfully"});
    } catch (error) {
        return res.status(500).json(error);
    }

})

router.get('/bin',fetchUser, async (req, res) => {
    try {
        const {query}=req.query;
        const regexPattern= new RegExp(query,'i');
        const folders = await Folder.find({ user: req.user.id,isDeleted: true,name: { $regex: regexPattern } });
        res.json(folders);
    } catch (error) {
        res.status(500).json(error);   
    }
});


module.exports = router