import { Router } from "express";
import { VerifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js";
import { createNotice, deleteNotice, getAllNotice, getNoticeById, updateNoticeAttachment, updateNoticedetail } from "../controllers/notice.controller.js";

const router = Router();

router.route("/create-notice").post(upload.single("attachment"), createNotice);
router.route("/delete-notice::noticeId").post(deleteNotice);
router.route("/update-detail::noticeId").patch(updateNoticedetail);
router.route("/update-attachment::noticeId").patch(upload.single("attachment"), updateNoticeAttachment)
router.route("/getAllnotice").get(getAllNotice)
router.route("/get-notice::noticeId").get(getNoticeById)

export default router;
