import { Router } from "express";

import { VerifyJWT } from "../middlewares/auth.middleware.js"
import { createComment, deleteComment, getCommentsOfComments, getPostsComments, getUserAllComment, updateComment } from "../controllers/comment.controller.js";

const router = Router();

router.route("/create-comment/:postId").post(VerifyJWT, createComment);
router.route("/delete-comment/:commentId").delete(deleteComment);
router.route("/update-comment/:commentId").patch(VerifyJWT, updateComment)
router.route("/get-user-comments").get(VerifyJWT, getUserAllComment)
router.route("/get-posts-comments/:postId").get(getPostsComments)
router.route("/get-comment-comments").get(getCommentsOfComments)

export default router;