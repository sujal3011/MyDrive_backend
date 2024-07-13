const express = require('express')
const router = express.Router();
const upload = require('../middleware/upload');
const Grid = require('gridfs-stream');
const mongoose = require('mongoose');
const File = require('../models/File');
const Share = require('../models/Share');
const fetchUser = require('../middleware/fetchUser');
const fs = require('fs');
const readline = require('readline');

const mongoURL = process.env.MONGO_URL

const conn = mongoose.createConnection(mongoURL);

let gfs;
conn.once('open', () => {


  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'uploads'
  });

  // gfs = Grid(conn.db, mongoose.mongo);
  // gfs.collection("uploads");

});

// POST: Uploading a new file

router.post('/upload', fetchUser, upload.single('file'), async (req, res) => {

  try {


    const newFile = new File({
      userId: req.user.id, original_name: req.file.originalname, file_id: req.file.id.toString(), file_type: req.file.contentType, path: req.header('path'), uploadDate: req.file.uploadDate
    })

    const savedFile = await newFile.save();
    res.json(savedFile);

  } catch (error) {
    res.status(500).send(error)
  }
})

// GET: Getting all original files

router.get('/getallfiles', (req, res) => {
  gfs.files.find().toArray((err, files) => {  //find() function returns mongoose collection,toArray() function converts this collection to a normal array
    if (!files || files.length === 0) {
      return res.status(404).json({ error: "No files exist" });
    }
    return res.json(files);
  })
})


// GET: Getting all files of a particular path
router.get('/getfilesbypath', fetchUser, async (req, res) => {

  try {
    const { query } = req.query;
    const regexPattern = new RegExp(query, 'i');
    const files = await File.find({ original_name: { $regex: regexPattern }, path: req.header('path'), userId: req.user.id });
    res.json(files);
  } catch (error) {
    res.status(500).send(error);
  }

})


// GET: Fetching a particular image and displaying it on browser

router.get('/image/:id', async (req, res) => {

  try {

    let referenceFile = await File.findById(req.params.id);

    gfs.find({ _id: new mongoose.Types.ObjectId(referenceFile.file_id) }).toArray((err, files) => {
      // Check if file
      if (!files[0] || files.length === 0) {
        return res.status(404).json({
          err: 'No file exists'
        });
      }

      // Check if image
      if (files[0].contentType === 'image/jpeg' || files[0].contentType === 'image/png' || files[0].contentType === 'image/svg+xml') {

        // Read output to browser
        const readStream = gfs.openDownloadStream(files[0]._id);
        readStream.pipe(res);
      } else {
        res.status(404).json({
          err: 'Not an image'
        });
      }
    });

  } catch (error) {
    res.status(500).json(error);
  }
});

//GET: Downloading a particular file

router.get('/downloadfile/:id', async (req, res) => {

  try {

    let referenceFile = await File.findById(req.params.id);

    gfs.find({ _id: new mongoose.Types.ObjectId(referenceFile.file_id) }).toArray((err, files) => {
      // Check if file
      if (!files[0] || files.length === 0) {
        return res.status(404).json({
          err: 'No file exists'
        });
      }

      const downloadStream = gfs.openDownloadStream(files[0]._id);
      // console.log(downloadStream);

      const originalFileName = referenceFile.original_name;

      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${originalFileName}"`,
        'file-Name': `${originalFileName}`,
      });
      res.set('Access-Control-Expose-Headers', 'file-Name');
      
      downloadStream.pipe(res);
    });

  } catch (error) {
    res.status(500).json(error);
  }
});

// GET: Fetching a particular file for previewing
router.get('/preview/:id', async (req, res) => {
  try {
    let referenceFile = await File.findById(req.params.id);
    gfs.find({ _id: new mongoose.Types.ObjectId(referenceFile.file_id) }).toArray((err, files) => {
      if (!files[0] || files.length === 0) {
        return res.status(404).json({ err: 'No file exists' });
      }
      const file = files[0];
      const readStream = gfs.openDownloadStream(file._id);
      console.log("type:",file.contentType);
      if (file.contentType.includes('image') || file.contentType === 'application/pdf' || file.contentType.includes('video')) {
        res.set('Content-Type', file.contentType);
        readStream.pipe(res);
      } else {
        res.set({
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${referenceFile.original_name}"`,
        });
        readStream.pipe(res);
      }
    });
  } catch (error) {
    res.status(500).json(error);
  }
});


// DELETE: Deleting a particular file

router.delete('/deletefile/:id', fetchUser, async (req, res) => {

  try {

    let file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).send("File not found");
    }
    if (file.userId.toString() !== req.user.id) {
      return res.status(401).send("You are not authorized.");
    }
    file = await File.findByIdAndDelete(req.params.id);  //Deleting the reference of the file
    // console.log(file);

    gfs.delete(new mongoose.Types.ObjectId(file.file_id),  //Deleting the original file from the database
      (error, data) => {
        if (error) {
          console.log(error);
          return res.status(404).json(error);
        }
        res.status(200).json({
          success: true,
          message: `File has been sucessfully deleted`
        })
      }
    )

  } catch (error) {
    res.status(500).json(error);
  }


})

// PUT : Renaming a particular file 

router.put('/renamefile/:id', fetchUser, async (req, res) => {

  const { name } = req.body

  try {

    let file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).send("Not found");
    }

    if (req.user.id !== file.userId.toString()) {
      return res.status(401).send("Not allowed");
    }

    const newFile = {};
    let subArray = file.original_name.split(".");
    let type = subArray[subArray.length - 1];
    if (name) {
      let new_name = name.concat(".", type);
      newFile.original_name = new_name;
    }

    file = await File.findByIdAndUpdate(req.params.id, { $set: newFile }, { new: true });
    res.json(file);

  } catch (error) {
    console.log(error);
    res.status(500).json(error)
  }
})

// PUT: Marking a particular file as starred

router.put('/starFile/:id', fetchUser, async (req, res) => {  //this is the id of the model and not of the original file

  try {
    const updatedFile = await File.findByIdAndUpdate({ _id: req.params.id }, { isStarred: true });
    res.json(updatedFile);

  } catch (error) {
    res.status(500).json(error);
  }

})

// PUT : Removing a particular file from starred

router.put('/removeStarFile/:id', fetchUser, async (req, res) => {  //this is the id of the model and not of the original file

  try {
    const updatedFile = await File.findByIdAndUpdate({ _id: req.params.id }, { isStarred: false });
    res.json(updatedFile);

  } catch (error) {
    res.status(500).json(error);
  }

})

// GET : Fetching all starred files 

router.get('/fetchstarredfiles', fetchUser, async (req, res) => {
  try {
    const { query } = req.query;
    const regexPattern = new RegExp(query, 'i');
    const starredFiles = await File.find({ isStarred: true, userId: req.user.id, original_name: { $regex: regexPattern } });
    res.json(starredFiles);

  } catch (error) {
    res.status(500).json(error);
  }
})

router.put('/bin/move/:id',async (req,res)=>{

  const id=req.params.id;
  try {
      
      const file=await File.findByIdAndUpdate(id,{
          isDeleted:true,
          deletionDate:new Date(),
      });
  
      if(!file){
          return res.status(404).json({success:false,error:"File not found"});
      }
      return res.status(200).json({success:true,message:"File moved to bin successfully"});
  } catch (error) {
      return res.status(500).json({success:false,error:"Internal Server Error"});
  }

})

router.put('/bin/restore/:id',fetchUser,async (req,res)=>{

  try {

    let file = await File.findById(req.params.id);
    if (!file) {
        return res.status(404).send("Not found");
    }

    if (req.user.id !== file.userId.toString()) {
        return res.status(401).send("Not allowed");
    }
    const updatedFile = await File.findByIdAndUpdate({ _id: req.params.id },{ isDeleted: false });
    return res.status(200).json({success:true,message:"File restored from bin successfully"});
} catch (error) {
    console.log(error);
    return res.status(500).json(error);
}
})

router.get('/bin',fetchUser, async (req, res) => {
  try {

      const { query } = req.query;
      const regexPattern = new RegExp(query, 'i');
      const files = await File.find({ isDeleted: true, userId: req.user.id, original_name: { $regex: regexPattern } });
      res.json(files);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get('/shared-with-me', fetchUser, async (req, res) => {
  try {
    const { query } = req.query;
    let searchFilter = { sharedWith: req.user.id, itemType: 'file' };
    const sharedFiles = await Share.find(searchFilter).exec();

    const fileIds = sharedFiles.map(share => share.itemId);
    let fileFilter = { _id: { $in: fileIds } };
    if (query) {
        fileFilter.original_name = { $regex: query, $options: 'i' };
    }
    const files = await File.find(fileFilter).exec();
    res.status(200).json(files);
} catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
}
})

router.get('/:id/owner', async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await File.findById(fileId).populate('userId');
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    const owner = file.userId;
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    return res.status(200).json({success:true,owner:owner});

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});




module.exports = router