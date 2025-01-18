import { User } from "../models/users.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
const VerifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    // Check for missing accessToken
    if (!accessToken) {
      throw new ApiError(401, "accesstoken is required");
    }

    // Verify the accessToken with secure secret
    const decodedData = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    // Ensure decoded data is valid (optional)
    if (!decodedData) {
      throw new ApiError(401, "Unauthorized: Invalid access token.");
    }

    // Fetch user data based on decoded user ID (consider performance)
    const user = await User.findById(decodedData._id).select("-password -refreshToken");

    // Ensure user exists (optional)
    if (!user) {
      throw new ApiError(401, "Unauthorized: User not found.");
    }

    // Attach user object to the request for further use
    req.user = user;

    next(); // Proceed to the protected route
  } catch (error) {
    console.error("Error verifying JWT:", error);

    // Handle errors appropriately (e.g., send a 401 response)
    throw new ApiError(401, "Unauthorized: Access denied.")
  }
});
export { VerifyJWT }