import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { getSearchUsers, getUser, getUserbyId, loginUser, logoutUser, registerUser, updateAvatar, updateBio, updateCommunitydetail, updatePassword, updateUserDetail } from "../controllers/user.controller.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.single("avatar"), registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(VerifyJWT, logoutUser);
router.route("/update-detail").patch(VerifyJWT, updateUserDetail)
router.route("/update-community-detail").patch(VerifyJWT, updateCommunitydetail)

router.route("/update-bio").patch(VerifyJWT, updateBio)

router.route("/update-avatar").patch(VerifyJWT, upload.single("avatar"), updateAvatar)
router.route("/update-password").patch(VerifyJWT, updatePassword)
router.route("/get-user").get(VerifyJWT, getUser);
router.route("/get-user-profile/:userId").get(VerifyJWT, getUserbyId);

router.route("/get-search-user/:searchKey").get(getSearchUsers);

export default router

//checkedo