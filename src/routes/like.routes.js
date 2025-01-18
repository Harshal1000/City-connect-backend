import { Router } from "express";

import { VerifyJWT } from "../middlewares/auth.middleware.js"
import { getAllLikeComment, getLikedPost, getPostLiked, toggleCommentLike, togglePostLike } from "../controllers/like.controller.js";

const router = Router();

router.route("/toggle-post-like/:postId").post(VerifyJWT, togglePostLike)
router.route("/get-postlike/:postId").get(VerifyJWT, getPostLiked)

router.route("/toggle-post-comment::commentId").post(VerifyJWT, toggleCommentLike)
router.route("/get-like-posts").get(VerifyJWT, getLikedPost);
router.route("/get-liked-comments").get(VerifyJWT, getAllLikeComment);

export default router

