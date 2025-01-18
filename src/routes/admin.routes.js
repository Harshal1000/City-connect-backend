import { Router } from "express";
import { VerifyAdmin } from "../middlewares/admin.middleware.js";
import { getAdmin, loginAdmin, logoutAdmin, refreshAccessToken, registerAdmin, updateAdminDetail, updatePassword } from "../controllers/admin.controller.js";

const router = Router();
router.route("/register").post(registerAdmin);

router.route("/login-admin").post(loginAdmin)
router.route("/logout-admin").post(VerifyAdmin, logoutAdmin)
router.route("/update-detail").patch(VerifyAdmin, updateAdminDetail)
router.route("/get-admin").get(VerifyAdmin, getAdmin)
router.route("/update-password").patch(VerifyAdmin, updatePassword)

router.route("/refresh-token").post(VerifyAdmin, refreshAccessToken)

export default router
//checked.