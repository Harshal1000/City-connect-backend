import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/users.model.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { isValidObjectId } from "mongoose";

const generateAccessTokenAndGenerateRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: true })
    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(500, "server error while generating accesstoken and refreshtoken")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  //get details from the user .
  //all field is required .
  //check if user already exist.
  //upload avatar on cloudinary.
  //save user in database.
  //return response as user register successfully
  //
  const { username, fullname, address, mobile, email, password } = req.body;
  const avatarLocalPath = req.file?.path;
  console.log(avatarLocalPath)
  if (!username || !fullname || !address || !mobile || !email || !password) {
    throw new ApiError(400, "All field is required.")
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]

  })
  if (existedUser) {
    throw new ApiError(400, "User already exists")
  }

  if (!avatarLocalPath) {
    throw new ApiError(404, "avatar file not found.")
  }
  const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
  if (!uploadedAvatar) {
    throw new ApiError(500, "server error while uploading avatar.")
  }
  const createdUser = await User.create({ username, fullname, address, mobile, email, avatar: uploadedAvatar.url, password })

  const user = await User.findById(createdUser._id).select(" -refreshToken -password")
  if (!createdUser) {
    throw new ApiError(500, "server error while regiter user")
  }
  return res.status(201).json(new ApiResponse(200, user, "user is regitered successfully."))
})

const loginUser = asyncHandler(async (req, res) => {
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
  const user = await User.findOne({ email });
  if (!user) {


    throw new ApiError(404, "user not found.")
  }
  const validateUser = await user.isPasswordCorrect(password);
  if (!validateUser) {
    throw new ApiError(400, "password incorrect.")
  }
  const { accessToken, refreshToken } = await generateAccessTokenAndGenerateRefreshToken(user._id);

  const options = {
    httpOnly: true,
    secure: true
  }
  res.clearCookie('accessToken')
  const LoggedInUser = await User.findById(user._id).select(" -refreshToken -password")

  return res.status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, LoggedInUser, "user login successfully."))

})

const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user; // Assuming user object is already populated by middleware

  try {
    // Update user document to invalidate refresh token (optional)
    await User.findOneAndUpdate(user._id, { $unset: { refreshToken: 1 } });

    // Clear the accessToken cookie on the client-side
    res.clearCookie('accessToken', { httpOnly: true, secure: true });

    return res.status(200).json(new ApiResponse(200, {}, 'User logout successful.'));
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json(new ApiResponse(500, {}, 'Error logging out.'));
  }
});

const updateBio = asyncHandler(async (req, res) => {
  const { bio } = req.body;
  if (!bio) {
    throw new ApiError(404, "bio not found.")
  }
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      bio
    }
  }, { new: true }).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(500, "server error while updating the details.")
  }
  return res.status(201).json(new ApiResponse(200, user, "User bio updated successfully"))

})


const updateCommunitydetail = asyncHandler(async (req, res) => {
  const { username, fullname, bio } = req.body;
  if (!username || !bio || !fullname) {
    throw new ApiError(400, "All field is required.")
  }
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      username, bio,
      fullname
    }
  }, { new: true }).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(500, "server error while updating the details.")
  }
  return res.status(201).json(new ApiResponse(200, user, "User details updated successfully"))
})

const updateUserDetail = asyncHandler(async (req, res) => {
  const { username, fullname, mobile, email } = req.body;
  console.log(username, fullname, mobile, email)
  if (!username || !fullname || !mobile || !email) {
    throw new ApiError(400, "All field is required.")
  }
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      username, email,
      fullname, mobile
    }
  }, { new: true }).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(500, "server error while updating the details.")
  }
  return res.status(201).json(new ApiResponse(200, user, "User details updated successfully"))

})

const updateAvatar = asyncHandler(async (req, res) => {
  const user = req.user;
  const avatarLocalPath = req.file.path;
  if (!avatarLocalPath) {
    throw new ApiError(404, "file not found")
  }
  const response = await uploadOnCloudinary(avatarLocalPath);
  const updatedUser = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      avatar: response.url
    }
  },
    { new: true }
  ).select("-refreshToken -password")
  if (!updatedUser) {
    throw new ApiError(500, "server error while updating avatar.")
  }
  await deleteOnCloudinary(user.avatar);
  return res.status(201).json(new ApiResponse(200, updatedUser, "avatar updated successfully."))
})

const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id)
  console.log(user)
  const isValid = await user.isPasswordCorrect(oldPassword);
  if (!isValid) {
    throw new ApiError(400, "old password must be right.")
  }
  user.password = newPassword;
  user.save({ validateBeforeSave: true })
  return res.status(200).json(new ApiResponse(200, {}, "password changed successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(404, "refresh Token not found.")
  }
  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decodedToken._id);
  if (!user) {
    throw new ApiError(404, "user not found.");

  }
  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(400, "unauthorized request");
  }
  const { accessToken, refreshToken } = generateAccessTokenAndGenerateRefreshToken(user._id);

  const options = {
    httpOnly: true,
    secure: true,
  }
  return res.status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", accessToken, options)
    .json(new ApiResponse(200, { accessToken, refreshToken }, "accessToken refreshed successfully"))
})

const getUserbyId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  console.log(userId)
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "userId invalid.")
  }
  const user = await User.findById(userId).select("-refreshToken -password")
  if (!user) {
    throw new ApiError(500, "server error while fetching profile.")
  }
  console.log(user)
  return res.status(200).json(new ApiResponse(200, user, "profile fetched successfully"))
})

const getUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(404, "user not found");
  }
  return res.status(201).json(new ApiResponse(200, user, "user fetched successfully"))
})

const getSearchUsers = asyncHandler(async (req, res) => {
  const { searchKey } = req.params;
  if (!searchKey) {
    return;
  }
  const regex = new RegExp(searchKey, 'i');
  const users = await User.find({ username: { $regex: regex } }).select("_id avatar username fullname ")
  if (users.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "user not found."))
  }
  return res.status(200).json(new ApiResponse(200, users, "user fetching is successfully completed."))

})
export {
  registerUser,
  loginUser,
  logoutUser,
  updateUserDetail,
  updateAvatar,
  updatePassword,
  refreshAccessToken,
  getUser,
  updateBio,
  getSearchUsers,
  getUserbyId,
  updateCommunitydetail
}