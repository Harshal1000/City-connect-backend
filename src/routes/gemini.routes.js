import { Router } from "express";
import { getCommentsSuggestion, getPostssummery, getTodaysTrendSummery, getUserProfileSummery, startChatting } from "../controllers/geminiAi.controller.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/get-comment/:postId").post(VerifyJWT, getCommentsSuggestion)
router.route("/get-post-summery/:postID").get(VerifyJWT, getPostssummery)
router.route("/get-user-summery/:userId").get(VerifyJWT, getUserProfileSummery)
router.route("/get-tag-summery").get(getTodaysTrendSummery)
router.route("/start-chatting").post(startChatting)


export default router