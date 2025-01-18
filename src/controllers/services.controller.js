import { isValidObjectId } from "mongoose";
import { Service } from "../models/Service.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createServices = asyncHandler(async (req, res) => {
  const { serviceName, serviceDate, serviceTime } = req.body;
  if (!serviceName || !serviceDate || !serviceTime) {
    throw new ApiError(404, "all fields are required.")
  }
  const service = await Service.create({ serviceDate, serviceName, serviceTime, user: req.user._id });
  if (!service) {
    throw new ApiError(500, "server error while creating appoiment.")
  }
  return res.status(201).json(new ApiResponse(201, service, "creating appoinment successfully"))
})

const updateAppoitmentStatus = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  if (!isValidObjectId(serviceId)) {
    throw new ApiError(400, "invalid ServiceId")
  }
  const { appointmentStatus } = req.body;
  if (!appointmentStatus) {
    throw new ApiError(404, "status not updated.")
  }
  const updatedstatus = await Service.findByIdAndUpdate(serviceId, { $set: { appointmentStatus } }, { new: true })
  if (!updatedstatus) {
    throw new ApiError(500, "server error while updating detail.")
  }
  return res.status(200).json(new ApiResponse(200, updatedstatus, "appointment status updated successfully"))
})

const getUserService = asyncHandler(async (req, res) => {
  const services = await Service.find({ user: req.user._id }).sort({ updatedAt: -1 });
  if (!services) {
    throw new ApiError(500, "server error while fetching data.")
  }
  if (services.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "there is not any services you appoint from this platform."))
  }
  return res.status(200).json(new ApiResponse(200, services, "all the data fetched successfully"))
})
const updateDateAndTime = asyncHandler(async (req, res) => {
  const { serviceDate, serviceTime } = req.body;
  const { serviceId } = req.params;
  if (!serviceDate || !serviceTime) {
    throw new ApiError(404, "all fields are required.")
  }
  if (!isValidObjectId(serviceId)) {
    throw new ApiError(400, "Invalid serviceID.")
  }
  const updatedService = await Service.findByIdAndUpdate(serviceId, {
    $set: { serviceDate, serviceTime }
  }, {
    new: true
  })
  if (!updatedService) {
    throw new ApiError(500, "server error while updating details.")
  }
  return res.status(200).json(new ApiResponse(200, updatedService, "details updated successfully"))
})

export {
  createServices,
  updateAppoitmentStatus,
  getUserService,
  updateDateAndTime
}