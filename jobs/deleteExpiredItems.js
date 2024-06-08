const cron = require('node-cron');
const Folder = require('../models/Folder');
const File = require('../models/File');

// Define the task to delete expired folders
const deleteExpiredFolders = async () => {
  try {
    // Find folders marked as deleted and older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const foldersToDelete = await Folder.find({ isDeleted: true, deletionDate: { $lt: thirtyDaysAgo } });

    // Delete the folders
    await Promise.all(foldersToDelete.map(folder => folder.remove()));
    
    console.log(`Deleted ${foldersToDelete.length} expired folders.`);
  } catch (error) {
    console.error('Error deleting expired folders:', error);
  }
};

// Define the task to delete expired files
const deleteExpiredFiles = async () => {
  try {
    // Find files marked as deleted and older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const filesToDelete = await File.find({ isDeleted: true, deletionDate: { $lt: thirtyDaysAgo } });

    // Delete the files
    await Promise.all(filesToDelete.map(file => file.remove()));
    
    console.log(`Deleted ${filesToDelete.length} expired files.`);
  } catch (error) {
    console.error('Error deleting expired files:', error);
  }
};

// Schedule the tasks to run daily at midnight
cron.schedule('0 0 * * *', deleteExpiredFolders);
cron.schedule('0 0 * * *', deleteExpiredFiles);
