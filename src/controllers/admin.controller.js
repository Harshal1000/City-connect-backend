import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { Admin } from "../models/admin.model.js";

const generateAccessTokenAndGenerateRefreshToken = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);
    const accessToken = await admin.generateAccessToken();
    const refreshToken = await admin.generateRefreshToken();
    admin.refreshToken = refreshToken;
    admin.save({ validateBeforeSave: true })
    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(500, "server error while generating accesstoken and refreshtoken")
  }
}


const registerAdmin = asyncHandler(async (req, res) => {
  //get details from the user .
  //all field is required .
  //check if user already exist.
  //upload avatar on cloudinary.
  //save user in database.
  //return response as user register successfully
  //
  const { adminname, mobile, email, password } = req.body;

  if (!adminname || !mobile || !email || !password) {
    throw new ApiError(400, "All field is required.")
  }
  const existedAdmin = await Admin.findOne({
    $or: [{ adminname }, { email }]

  })
  if (existedAdmin) {
    throw new ApiError(400, "Admin already exists")
  }

  const createdAdmin = await Admin.create({ adminname, mobile, email, password })

  const admin = await Admin.findById(createdAdmin._id).select(" -refreshToken -password")
  if (!createdAdmin) {
    throw new ApiError(500, "server error while regiter Admin")
  }
  return res.status(201).json(new ApiResponse(200, admin, "Admin is regitered successfully."))
})

const loginAdmin = asyncHandler(async (req, res) => {
  //get username and password .
  //validate each field is required.
  //find user if available 
  //check if password is correct or not 
  //generate tokens.
  //send cookies.
  //return response .

  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(200, "All field is required.");
  }
  const admin = await Admin.findOne({ email });
  if (!admin) {


    throw new ApiError(404, "unAuthorized request.")
  }
  const validateAdmin = await admin.isPasswordCorrect(password);
  if (!validateAdmin) {
    throw new ApiError(400, "password incorrect.")
  }
  const { accessToken, refreshToken } = await generateAccessTokenAndGenerateRefreshToken(admin._id);

  const options = {
    httpOnly: true,
    secure: true
  }
  res.clearCookie('accessToken')
  const LoggedInAdmin = await Admin.findById(admin._id).select(" -refreshToken -password")

  return res.status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, LoggedInAdmin, "Admin login successfully."))

})

const logoutAdmin = asyncHandler(async (req, res) => {
  const admin = req.admin; // Assuming user object is already populated by middleware

  try {
    // Update user document to invalidate refresh token (optional)
    await Admin.findOneAndUpdate(admin._id, { $unset: { refreshToken: 1 } });

    // Clear the accessToken cookie on the client-side
    res.clearCookie('accessToken', { httpOnly: true, secure: true });

    return res.status(200).json(new ApiResponse(200, {}, 'Admin logout successful.'));
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json(new ApiResponse(500, {}, 'Error logging out.'));
  }
});

const updateAdminDetail = asyncHandler(async (req, res) => {
  const { adminname, mobile, email } = req.body;
  console.log(adminname, mobile, email)
  if (!adminname || !mobile || !email) {
    throw new ApiError(400, "All field is required.")
  }
  const admin = await Admin.findByIdAndUpdate(req.admin._id, {
    $set: {
      adminname, email,
      mobile
    }
  }, { new: true }).select("-password -refreshToken");
  if (!admin) {
    throw new ApiError(500, "server error while updating the details.")
  }
  return res.status(201).json(new ApiResponse(200, admin, "Admin details updated successfully"))

})


const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.admin?._id)
  const isValid = await admin.isPasswordCorrect(oldPassword);
  if (!isValid) {
    throw new ApiError(400, "old password must be right.")
  }
  admin.password = newPassword;
  admin.save({ validateBeforeSave: true })
  return res.status(200).json(new ApiResponse(200, {}, "password changed successfully"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(404, "refresh Token not found.")
  }
  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  const admin = await Admin.findById(decodedToken._id);
  if (!admin) {
    throw new ApiError(404, "admin not found.");

  }
  if (admin.refreshToken !== incomingRefreshToken) {
    throw new ApiError(400, "unauthorized request");
  }
  const { accessToken, refreshToken } = generateAccessTokenAndGenerateRefreshToken(admin._id);

  const options = {
    httpOnly: true,
    secure: true,
  }
  return res.status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", accessToken, options)
    .json(new ApiResponse(200, { accessToken, refreshToken }, "accessToken refreshed successfully"))
})

const getAdmin = asyncHandler(async (req, res) => {
  const admin = req.admin;
  if (!admin) {
    throw new ApiError(404, "admin not found");
  }
  return res.status(201).json(new ApiResponse(200, admin, "admin fetched successfully"))
})


const getAdminProfile = asyncHandler(async (req, res) => {

})


export {
  getAdmin,
  updateAdminDetail,
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  registerAdmin,
  updatePassword,
  getAdminProfile
}