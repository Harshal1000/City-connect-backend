import mongoose, { Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2"
const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  attachment: {
    type: Object,//cloudinary url,
    trim: true,
  },
  tags: {
    type: String,
    default: "",
    lowercase: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

postSchema.plugin(aggregatePaginate)

export const Post = mongoose.model("Post", postSchema) 