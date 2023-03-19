const express = require('express')
const router = express.Router();
const upload = require('../middleware/upload');
const Grid = require('gridfs-stream');
const mongoose = require('mongoose');
const File = require('../models/File');
const fetchUser = require('../middleware/fetchUser');

const mongoURL = process.env.MONGO_URL

const conn = mongoose.createConnection(mongoURL);

let gfs, gridfsBucket;
conn.once('open', () => {


  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'uploads'
  });

  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");

})



// Uploading a new file

router.post('/upload', fetchUser, upload.single('file'), async (req, res) => {

  try {

    const newFile = new File({
      userId: req.user.id, original_name: req.file.originalname, file_name: req.file.filename, path: req.header('path'), uploadDate: req.file.uploadDate
    })
  
    const savedFile = await newFile.save();
    res.json(savedFile);
    
  } catch (error) {
    res.status(500).send(error)
  }
  
  

})

// Getting all original files

router.get('/getallfiles', (req, res) => {
  gfs.files.find().toArray((err, files) => {  //find() function returns mongoose collection,toArray() function converts this collection to a normal array
    if (!files || files.length === 0) {
      return res.status(404).json({ error: "No files exist" });
    }
    return res.json(files);
  })
})


// Getting all files of a particular path
router.get('/getfilesbypath', fetchUser, async (req, res) => {

  try {
    const files = await File.find({ path: req.header('path'), userId:req.user.id });
    res.json(files);
  } catch (error) {
    res.status(500).send(error);
  }

})

//Getting a original file by its filename

// router.get('/:filename', (req, res) => {
//   gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
//     // Check if file
//     if (!file || file.length === 0) {
//       return res.status(404).json({
//         err: 'No file exists'
//       });
//     }
//     // File exists
//     return res.json(file);
//   });
// });


//Displaying the image

router.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readStream = gridfsBucket.openDownloadStream(file._id);
      readStream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});


// Deleting a file

router.delete('/deletefile/:id', (req, res) => {

  try {

    // gfs.files.find({ _id: req.params.id }).toArray((err, files) => {
    //   if (!files[0] || files.length === 0) {
    //     return res.status(404).json({ error: "No file found" });
    //   }

    //   // File exists
      
    // })
    
    gfs.Delete({_id:req.params.id}, (error, data) => {
      if (error) {
        return res.status(404).json(error);
      }
      return res.status(200).json({
        message: `File with id ${req.params.id} has been sucessfully deleted`
      })
    });
    

  } catch (error) {
  res.status(500).json(error);
}


})

router.put('/renamefile/:id',fetchUser,async (req,res)=>{

  const {name}=req.body

  // try {

  //   gfs.rename((req.params.id,"new name"), (error, file) => {
  //     if (error) {
  //       return res.status(404).json(error);
  //     }
  //     return res.status(200).json(file);
  //   });
    
  // } catch (error) {
  //   res.status(500).json(error);
  // }

  try {
    const newFile={}
    let subArray=newFile.original_name.split(".");
    let type=subArray[subArray.length-1];
    if(name) {
      let new_name=name.concat(".",type);
      newFile.original_name=new_name;


    }

    let file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).send("Not found");
  }

  if (req.user.id !== file.userId.toString()) {
      return res.status(401).send("Not allowed");
  }

  file = await File.findByIdAndUpdate(req.params.id, { $set: newFile }, { new: true });
        res.json(file);
    
  } catch (error) {
    res.status(500).json(error)
  }
})

router.put('/starFile/:id',async (req,res)=>{  //this is the id of the model and not of the original file

  try {
    const updatedFile=await File.findByIdAndUpdate({_id:req.params.id},{isStarred:true});
    res.json(updatedFile);

  } catch (error) {
    res.status(500).json(error);
  }

})

router.put('/removeStarFile/:id',async (req,res)=>{  //this is the id of the model and not of the original file

  try {
    const updatedFile=await File.findByIdAndUpdate({_id:req.params.id},{isStarred:false});
    res.json(updatedFile);

  } catch (error) {
    res.status(500).json(error);
  }

})


router.get('/fetchstarredfiles',async (req,res)=>{
  try {
    const starredFiles=await File.find({isStarred:true});
    res.json(starredFiles);

  } catch (error) {
    res.status(500).json(error);
  }
})






module.exports = router