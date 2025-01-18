import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const togglePostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  // Validate postId
  if (!isValidObjectId(postId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid postId."));
  }

  try {
    // Check if the user has already liked the post
    const existingLike = await Like.findOne({ likePost: postId, LikedBy: req.user._id }).exec();

    if (existingLike) {
      // If already liked, unlike the post
      await Like.deleteOne({ _id: existingLike._id }).exec();
      return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Post unliked successfully."));
    } else {
      // If not liked, like the post
      const newLike = await Like.create({ likePost: postId, LikedBy: req.user._id });
      if (!newLike) {
        throw new ApiError(500, "Error liking the post.");
      }
      return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Post liked successfully."));
    }
  } catch (error) {
    // Handle errors
    console.error("Error toggling like:", error);
    return res.status(500).json(new ApiResponse(500, null, "Internal server error."));
  }
});


const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "commentId is invalid.")
  }

  const like = await Like.findOne({ likeComment: commentId, LikedBy: req.user._id })
  if (like) {
    await like.deleteOne();
    return res.status(200).json(new ApiResponse(200, {}, "comment inliked successfully."))
  } else {
    const LikedCOmment = await Like.create({ likeComment: commentId, LikedBy: req.user._id })
    if (!LikedCOmment) {
      throw new ApiError(500, "server error while liked video .")
    }
    return res.status(200).json(new ApiResponse(200, {}, "comment successfully liked"))
  }
})

const getLikedPost = asyncHandler(async (req, res) => {
  const { page = 1, limit = 4 } = req.query;

  const pipeline = Like.aggregate([
    {
      $match: {
        LikedBy: new mongoose.Types.ObjectId(req.user?._id),
        likeComment: { $exists: false },
        likePost: { $exists: true }
      }
    },
    {
      $lookup: {
        from: "posts",
        localField: "likePost",
        foreignField: "_id",
        as: "post",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "user",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              user: { $first: "$user" }
            }
          },
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "likePost",
              as: "likes"
            }
          },
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "post",
              as: "comments"
            }
          },
          {
            $addFields: {
              likes: { $size: "$likes" },
              comments: { $size: "$comments" },
              isLiked: {
                $cond: {
                  if: { $in: [req.user._id, "$likes.LikedBy"] },
                  then: true,
                  else: false
                }
              }
            }
          }
        ]
      }
    },
    {
      $unwind: {
        path: "$post",
        preserveNullAndEmptyArrays: true // Keep documents without `post`
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customLabels: {
      totalDocs: "totalLikesPost",
      docs: "Posts"
    },
    skip: (parseInt(page, 10) - 1) * parseInt(limit, 10)
  };

  try {
    const response = await Like.aggregatePaginate(pipeline, options);

    console.log('Aggregation response:', response);

    if (!response) {
      throw new ApiError(500, "Server error while fetching liked posts.");
    }

    return res.status(200).json(new ApiResponse(200, response, "All the posts liked by you have been fetched successfully"));
  } catch (error) {
    console.error('Error in getLikedPost:', error);
    throw new ApiError(500, "Server error while fetching liked posts.");
  }
});


const getPostLiked = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  // Validate postId
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "invalid postId")
  }

  try {
    const likedCount = await Like.countDocuments({ likePost: postId }).exec();

    const existingLike = await Like.findOne({ likePost: postId, LikedBy: req.user._id }).exec();
    if (!existingLike) {
      return res.status(200).json(new ApiResponse(200, { likedCount, isLiked: false }, "Likes fetched successfully."));
    } else {
      return res.status(200).json(new ApiResponse(200, { likedCount, isLiked: true }, "Likes fetched successfully."));

    }

  } catch (error) {
    throw new ApiError(500, "server error while counting likes")
  }
});

const getAllLikeComment = asyncHandler(async (req, res) => {

  const allLikedComment = await Like.find({
    LikedBy: req.user._id,
    likePost: { $exists: false },
    likeComment: { $exists: true }
  }).populate('likeComment'); // populate the liked post details
  if (!allLikedComment) {
    throw new ApiError(500, "server error while fetching liked post.")
  }

  // Extract only the posts from the likes
  const likedComments = allLikedComment.map(like => like.likeComment);
  if (!likedComments) {
    return res.status(200).json(new ApiResponse(200, {}, "not any comments liked by you."))
  }
  return res.status(200).json(new ApiResponse(200, likedPosts, "all the comments liked by you is fetched successfully"))

})

export {
  toggleCommentLike,
  togglePostLike,
  getAllLikeComment,

  getPostLiked,
  getLikedPost
}
//checked.