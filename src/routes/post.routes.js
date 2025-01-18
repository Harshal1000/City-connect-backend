import { Router } from "express";
import { VerifyJWT } from "../middlewares/auth.middleware.js"
import { createPost, deletePost, getAllPost, getByTagName, getPostById, getPostByuser, getTags, updateAttachment, updatePostDetail } from "../controllers/post.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/get-allpost").get(VerifyJWT, getAllPost);
router.route("/create-post").post(VerifyJWT, upload.single("attachment"), createPost);
router.route("/get-post/:postId").get(VerifyJWT, getPostById)
router.route("/get-posts").get(VerifyJWT, getPostByuser)
router.route("/get-tags").get(getTags)
router.route("/delete-post/:postId").post(VerifyJWT, deletePost)
router.route("/update-post/:postId").patch(VerifyJWT, updatePostDetail)
router.route("/update-attachment::postId").patch(VerifyJWT, upload.single("attachment"), updateAttachment)
router.route("/get-by-search/:searchKey").get(VerifyJWT, getByTagName)

export default router;

//checked