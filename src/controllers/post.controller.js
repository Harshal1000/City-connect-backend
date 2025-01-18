import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { Post } from "../models/post.model.js";

const createPost = asyncHandler(async (req, res) => {
  const { content, tags } = req.body;
  const attachmentLocalPath = req.file?.path;
  if (!content) {
    throw new ApiError(400, "All fields are required")
  }
  if (!attachmentLocalPath) {
    const post = await Post.create({
      content,
      tags,
      user: req.user._id,
    });
    if (!post) {
      throw new ApiError(500, "server error while creating post.")
    }
    return res.status(201).json(new ApiResponse(200, post, "Post created successfully"))

  } else {
    const uploadedFile = await uploadOnCloudinary(attachmentLocalPath);
    if (!uploadedFile) {
      throw new ApiError(500, "server error while uploading file on cloudinary.")
    }
    const post = await Post.create({
      content,
      tags,
      attachment: uploadedFile,
      user: req.user._id,
    });
    if (!post) {
      throw new ApiError(500, "server error while creating post.")
    }
    return res.status(201).json(new ApiResponse(200, post, "Post created successfully"))
  }
})

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "postId is not valid.")
  }

  const post = await Post.findByIdAndDelete(postId)
  if (!post) {
    throw new ApiError(404, "post not found.")
  }
  const deletedfile = await deleteOnCloudinary(post.attachment);
  if (!deletedfile) {
    throw new ApiError(500, "server error while deleting file")
  }
  return res.status(201).json(new ApiResponse(200, post, "post deleted successfully"))
})

const updatePostDetail = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content, tags } = req.body;

  if (!content || !tags) {
    throw new ApiError(400, "all fields are required.")
  }
  if (!postId) {
    throw new ApiError(400, "postId is not valid.")
  }
  const post = await Post.findByIdAndUpdate(postId,
    {
      $set: { content, tags }
    },
    {
      new: true,
    })
  if (!post) {
    throw new ApiError(500, "server error while updating postdetail.")
  }
  return res.status(201).json(new ApiResponse(200, post, "detail updated successfully"))
})

const updateAttachment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "postId is invalid")
  }
  const attachmentLocalPath = req.file.path;

  if (!attachmentLocalPath) {
    throw new ApiError(404, "attachment not found")
  }
  const post = await Post.findById(postId)
  if (!post) {
    throw new ApiError(404, "post not found.")
  }

  const uploadedFile = await uploadOnCloudinary(attachmentLocalPath);
  if (!uploadedFile) {
    throw new ApiError(500, "server error while uploading file.")
  }

  const updatedPost = await Post.findByIdAndUpdate(postId, {
    $set: {
      attachment: uploadedFile
    }
  }, { new: true })
  if (!updatedPost) {
    throw new ApiError(500, "server error while updating file.")
  }
  await deleteOnCloudinary(post.attachment.url);
  return res.status(201).json(new ApiResponse(200, updatedPost, "post updated successfully"))
})

const getAllPost = asyncHandler(async (req, res) => {
  const { page = 1, limit = 4 } = req.query;

  const aggregateQuery = Post.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [{
          $project: {
            "_id": 1,
            "username": 1,
            "avatar": 1,
          }
        }
        ]
      }
    },
    { $addFields: { "user": { $first: "$user" } } },
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
        likesCount: { $size: "$likes" },
        commentsCount: { $size: "$comments" },
        isLiked: {
          $cond: {
            if: { $in: [req.user._id, "$likes.LikedBy"] },
            then: true,
            else: false
          }
        }
      }
    },
    { $sort: { updatedAt: -1 } } // Sort in descending order of updatedAt
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customLabels: {
      totalDocs: 'totalPosts',
      docs: 'posts'
    }
  };

  try {
    const response = await Post.aggregatePaginate(aggregateQuery, options);
    return res.status(200).json(new ApiResponse(200, response, 'All posts fetched successfully'));
  } catch (error) {
    throw new ApiError(500, `ApiError while aggregation: ${error.message}`);
  }
});

const getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) {
    throw new ApiError(400, "postId is invalid")
  }
  const post = await Post.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(postId) } }, {
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "user",
      pipeline: [
        {
          $project: {
            username: 1,
            avatar: 1
          }
        }
      ]
    }
  }, {
    $addFields: { user: { $first: "$user" } }
  }])
  if (!post) {
    throw new ApiError(404, "post not found.")
  }
  return res.status(201).json(new ApiResponse(200, post, "post fetched successfully"))
})

const getTags = asyncHandler(async (req, res) => {
  const { page = 2, limit = 10 } = req.query;
  const tags = Post.aggregate([
    {
      $project: {
        characters: { $split: ["$tags", " "] } // Split tags into individual characters
      }
    },
    {
      $unwind: "$characters" // Unwind the array to have one document per character
    },
    {
      $match: {
        characters: { $ne: "" },
        // Exclude empty characters if any
      }
    },
    {
      $group: {
        _id: "$characters", // Group by character
        count: {
          $sum: 1
        } // Count occurrences
      }
    }, {
      $match: { "count": { $gte: 2 } }
    }, {
      $sort: { count: -1 }
    }])

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    customlabel: {
      totalDocs: "totaltags",
      docs: "tags"
    }
  }
  const response = await Post.aggregatePaginate(tags, options)
  return res.status(201).json(new ApiResponse(200, response, "tags fetched successfully"))
})

const getByTagName = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { searchKey } = req.params;
  const posts = Post.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [{
          $project: {
            _id: 1,
            username: 1,
            avatar: 1,
          }
        }]
      }
    },
    {
      $addFields: { user: { $first: "$user" } }
    }, {
      $match: { $or: [{ tags: { $regex: searchKey } }, { content: { $regex: searchKey } }, { "user.username": { $regex: searchKey } }] }
    }, {
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
        likesCount: { $size: "$likes" },
        commentsCount: { $size: "$comments" },
        isLiked: {
          $cond: {
            if: { $in: [req.user._id, "$likes.LikedBy"] },
            then: true,
            else: false
          }
        }
      }
    }, {
      $sort: { createdAt: -1 }
    }
  ])
  // console.log(posts)
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customLabels: {
      totalDocs: "totalPosts",
      docs: "posts"
    },
    skip: (page - 1) * limit
  }
  const response = await Post.aggregatePaginate(posts, options);
  res.status(200).json(new ApiResponse(200, response, "searched posts fetched successfully"))
})


const getPostByuser = asyncHandler(async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 4 } = req.query;

  const posts = Post.aggregate([{ $match: { user: user._id } }, {
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
      likesCount: { $size: "$likes" },
      commentsCount: { $size: "$comments" },
      isLiked: {
        $cond: {
          if: { $in: [req.user._id, "$likes.LikedBy"] },
          then: true,
          else: false
        }
      }
    }
  },
  { $sort: { updatedAt: -1 } }]);
  if (posts.length === 0) {
    return res.status(201).json(new ApiResponse(200, [], "there isn't any post available."))
  }
  if (!posts) {
    throw new ApiError(500, "server error while fetching posts.")
  }
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customLabels: {
      total: "totalPosts",
      docs: "posts",
    },
    skip: (page - 1) * limit,
    sort: { updatedAt: -1 }
  }
  const response = await Post.aggregatePaginate(posts, options);
  return res.status(201).json(new ApiResponse(200, response, "all posts fetched successfully"))

})
export {
  createPost,
  updatePostDetail,
  deletePost,
  updateAttachment,
  getPostById,
  getAllPost,
  getPostByuser,
  getTags,
  getByTagName
}


//checked.