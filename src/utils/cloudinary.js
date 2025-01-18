import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"
import { extractPublicId } from "cloudinary-build-url"


dotenv.config({ path: "./.env" })


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const deleteOnCloudinary = async (avatarUrl) => {
  try {
    if (!avatarUrl) return null
    const publicId = extractPublicId(avatarUrl);
    const response = await cloudinary.uploader.destroy(publicId);
    return response
  } catch (error) {
    return null;
  }

}
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })
    // file has been uploaded successfull
    //console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath)
    return response;

  } catch (error) {
    fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
}



export { uploadOnCloudinary, deleteOnCloudinary }