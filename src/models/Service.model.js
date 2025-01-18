import mongoose, { Schema } from "mongoose";

const serviceSchema = new mongoose.Schema({
  serviceName:
  {
    type: String,
    required: true,
    default: "NA"
  },
  serviceDate: {
    type: String,
    required: true,
  },
  serviceTime: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  appointmentStatus: {
    type: String,
    required: true,
    default: "pending"
  },
  isPayment: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export const Service = mongoose.model("Service", serviceSchema)