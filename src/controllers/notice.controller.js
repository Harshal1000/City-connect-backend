import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { Notice } from "../models/notice.model.js";
import { isValidObjectId } from "mongoose";

const createNotice = asyncHandler(async (req, res) => {
  const { subject, content } = req.body;
  const attachmentLocalPath = req.file?.path;

  if (!subject || !content || !attachment) {
    throw new ApiError(400, "All files are required.")
  }
  if (!attachmentLocalPath) {
    throw new ApiError(404, "file not found.")
  }
  const uploadedFile = await uploadOnCloudinary(attachmentLocalPath);
  if (!uploadedFile) {
    throw new ApiError(500, "server error while uploading file.")
  }
  const notice = await Notice.create({
    subject, content, attachment: uploadedFile.url
  })
  if (!notice) {
    throw new ApiError(500, "server error while creating notice.")
  }
  res.status(201).json(new ApiResponse(200, notice, "notice created Successfully"))

})

const deleteNotice = asyncHandler(async (req, res) => {
  const { noticeId } = req.params;
  if (!isValidObjectId(noticeId)) {
    throw new ApiError(400, "noticeID is unvalid.")
  }
  const notice = await Notice.findByIdAndDelete(noticeId);
  const attachmenturl = notice.attachment
  await deleteOnCloudinary(attachmenturl);

  if (!notice) {
    throw new ApiError(404, "Notice not found.")
  }
  return res.status(201).json(new ApiResponse(200, notice, "notice is deleted Successfully"))
})

const updateNoticedetail = asyncHandler(async (req, res) => {
  const { noticeId } = req.params;
  const { subject, content } = req.body;
  if (!subject || !content) {
    throw new ApiError(400, "all field is required.")
  }
  if (!isValidObjectId(noticeId)) {
    throw new ApiError(400, "noticeID is unvalid.")
  }
  const notice = await Notice.findByIdAndUpdate(noticeId, {
    $set: {
      subject,
      content
    }
  }, { new: true });
  if (!notice) {
    throw new ApiError(404, "server error while updating detail of notice.")
  }
  return res.status(201).json(new ApiResponse(200, notice, "notice is updated Successfully"))
})

const updateNoticeAttachment = asyncHandler(async (req, res) => {
  const attachmentLocalPath = req.file?.path;
  const { noticeId } = req.params;

  if (!isValidObjectId(noticeId)) {
    throw new ApiError(400, "Invalid notice ID."); // More specific error message
  }

  if (!attachmentLocalPath) {
    throw new ApiError(400, "Attachment file not found."); // 400 for bad request
  }

  const notice = await Notice.findById(noticeId);
  if (!notice) {
    throw new ApiError(404, "Notice not found.");
  }

  const attachmentURL = notice.attachment;

  const uploadedFile = await uploadOnCloudinary(attachmentLocalPath);
  if (!uploadedFile) {
    throw new ApiError(500, "Error uploading attachment to Cloudinary."); // More specific error
  }

  if (attachmentURL) {
    try {
      await deleteOnCloudinary(attachmentURL);
    } catch (error) {
      console.error("Error deleting old attachment:", error);
      throw new ApiError(500, "Error deleting old attachment.");
    }
  }

  notice.attachment = uploadedFile.url;
  await notice.save({ validateBeforeSave: true });

  return res.status(201).json(new ApiResponse(200, notice, "Notice attachment updated successfully"));
});


const getAllNotice = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = -1 } = req.query;
  try {
    const notice = Notice.aggregate([{
      $sort: { "updatedAt": sortBy || -1 }
    }])
    const Options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      customLabels: {
        total: "totalNotice",
        docs: "notices",
      },
      skip: (page - 1) * limit,
    }
    const result = await Notice.aggregatePaginate(notice, Options);
    return res.status(201).json(new ApiResponse(200, result, "Notices fetched successfully."))
  } catch (error) {
    throw new ApiError(500, "Server error while retrieving notices.")
  }

})

const getNoticeById = asyncHandler(async (req, res) => {
  const { noticeId } = req.params;
  if (!isValidObjectId(noticeId)) {
    throw new ApiError(400, "noticeId is invalid")
  }
  const notice = await Notice.findById(noticeId);
  if (!notice) {
    throw new ApiError(404, "Notice not found.")
  }
  return res.status(201).json(new ApiResponse(200, notice, "notice is fetched successfully"))
})

export {
  createNotice,
  deleteNotice,
  updateNoticedetail,
  updateNoticeAttachment,
  getAllNotice,
  getNoticeById
}