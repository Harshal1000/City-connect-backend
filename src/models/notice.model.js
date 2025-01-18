import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const noticeSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
    index: true,
  },
  attachment: {
    type: String,//cloudinary url.
    required: true,
  },
}, { timestamps: true });

noticeSchema.plugin(mongooseAggregatePaginate);

export const Notice = mongoose.model("Notice", noticeSchema)