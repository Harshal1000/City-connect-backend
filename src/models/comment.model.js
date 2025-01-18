import mongoose, { Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "post"
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }
}, { timestamps: true });
commentSchema.plugin(aggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema) 