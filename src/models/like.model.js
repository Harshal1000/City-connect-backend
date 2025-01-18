import mongoose, { Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2"

const likeSchema = new mongoose.Schema({
  likePost: {
    type: Schema.Types.ObjectId,
    ref: "Post",
  },
  LikedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  likeComment: {
    type: Schema.Types.ObjectId,
    ref: "Comment"
  },
}, { timestamps: true });

likeSchema.plugin(aggregatePaginate)

export const Like = mongoose.model("Like", likeSchema) 