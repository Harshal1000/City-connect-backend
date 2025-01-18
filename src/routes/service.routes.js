import { Router } from "express";
import { createServices, getUserService, updateAppoitmentStatus, updateDateAndTime } from "../controllers/services.controller.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/create-service").post(VerifyJWT, createServices)
router.route("/update-status/:serviceId").patch(updateAppoitmentStatus);
router.route("/get-user-services").get(VerifyJWT, getUserService);
router.route("/update-detail/:serviceId").patch(updateDateAndTime);

export default router;