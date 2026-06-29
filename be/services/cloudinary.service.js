const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadImage = async (filePath) => {
  const result = await cloudinary.uploader.upload(
    filePath,
    {
      folder: "avatars",
    }
  );

  return result.secure_url;
};

const uploadIssueMedia = async (filePath) => {
  const result = await cloudinary.uploader.upload(
    filePath,
    {
      folder: "issues",
      resource_type: "auto",
    }
  );

  return result.secure_url;
};

module.exports = { uploadImage, uploadIssueMedia };