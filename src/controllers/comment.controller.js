import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";

const createComment = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  const { content } = req.body;
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "invalid post Id.")
  }
  if (!content) {
    throw new ApiError(404, "content not available.")
  }
  const comment = await Comment.create({
    content,
    user: req.user._id,
    post: postId
  })
  if (!comment) {
    throw new ApiError(500, "server error while creating comment.")
  }
  return res.status(201).json(new ApiResponse(200, comment, "comment created successfully."))
})

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId) {
    throw new ApiError(400, "invalid commentId.")
  }
  const comment = await Comment.findByIdAndDelete(commentId);
  if (!comment) {
    throw new ApiError(500, "server error while deleting comment.")
  }
  return res.status(200).json(200, comment, "comment deleted successfully")

})

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId) {
    throw new ApiError(400, "invalid commentId.")
  }
  const { content } = req.body;
  const updatedComment = await Comment.findByIdAndUpdate(commentId, {
    $set: {
      content
    }
  }, { new: true })
  if (!updatedComment) {
    throw new ApiError(500, "server error while updating comment ")
  }
  return res.status(200).json(new ApiResponse(200, updatedComment, "comment updated successfully"))
})

const getUserAllComment = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const comments = Comment.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "posts",
        localField: "post",
        foreignField: "_id",
        as: "post",
        pipeline: [{
          $project: {
            _id: 1,
            content: 1,
            tags: 1,
            attachment: 1,
            user: 1,
            createdAt: 1

          }
        }, {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
            pipeline: [{
              $project: {
                _id: 1,
                avatar: 1,
                username: 1,
                fullname: 1,
              }
            }]
          }
        }, {
          $addFields: { user: { $first: "$user" } }
        }]
      }
    }, { $addFields: { post: { $first: "$post" } } }, {
      $sort: {
        updatedAt: -1,
      },
    },
  ])
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customeLabel: {
      totalDocs: "totalComments",
      Docs: "comments"
    },
    skip: (page - 1) * limit
  }

  const response = await Comment.aggregatePaginate(comments, options)
  return res.status(200).json(new ApiResponse(200, response, "all comments fetched successfully of user."))
})

const getPostsComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 8 } = req.query;

  if (!postId) {
    throw new ApiError(400, "videoid is invalid.")
  }
  const comments = Comment.aggregate([{
    $match: {
      post: new mongoose.Types.ObjectId(postId)
    }
  }, {
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "user",
      pipeline: [{
        $project: {
          _id: 1,
          username: 1,
          avatar: 1
        }
      }]
    }
  }, {
    $addFields: { user: { $first: "$user" } }
  }, {
    $sort: {
      updatedAt: -1
    }
  }])
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customeLabel: {
      totalDocs: "totalComments",
      docs: "comments"
    },
    skip: (page - 1) * limit
  }

  try {
    const response = await Comment.aggregatePaginate(comments, options)
    return res.status(200).json(new ApiResponse(200, response, "all comment get successfully"))
  } catch (error) {
    throw new ApiError(500, "server error while fetching comments.")
  }
})

const getCommentsOfComments = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "commentid invalid")
  }
  const { page = 1, limit = 4 } = req.query;
  const comments = Comment.aggregate([{
    $match: {
      _id: commentId
    }
  }, {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "comment",
      as: "comments",
    }
  }])

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customeLabel: {
      totalDocs: "totalComments",
      Docs: "comments"
    },

    skip: (page - 1) * limit
  }
  try {

    const response = await Comment.aggregatePaginate(comments, options)
    return res.status(200).json(new ApiResponse(200, response, "comments of comment fetched successfully"))
  } catch (error) {
    throw new ApiError(500, "server error while fetching comments of comment.")
  }
})

export {
  getUserAllComment,
  getCommentsOfComments,
  getPostsComments,
  createComment,
  deleteComment,
  updateComment
}

//checked