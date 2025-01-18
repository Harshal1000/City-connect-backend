import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()
import dotenv from "dotenv"

dotenv.config({ path: "./.env" })

import userRoutes from "./routes/user.routes.js"
import adminRoutes from "./routes/admin.routes.js"
import postRoutes from "./routes/post.routes.js"
import likeRoutes from "./routes/like.routes.js"
import commentRoutes from "./routes/comment.routes.js"
import noticeRoutes from "./routes/notice.routes.js"
import serviceRouter from "./routes/service.routes.js"
import geminiRouter from "./routes/gemini.routes.js"


app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "*"),
    credentials: true,
  })
)
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admins", adminRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/likes", likeRoutes);
app.use("/api/v1/comments", commentRoutes)
app.use("/api/v1/notices", noticeRoutes)
app.use("/api/v1/services", serviceRouter)
app.use("/api/v1/gemini", geminiRouter)


export { app }
