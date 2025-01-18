import { app } from "./app.js"
import dotenv from "dotenv"
dotenv.config({ path: "./.env" })

import { connection } from "./database/dbConnection.js"

connection().then(() => {
  app.listen(process.env.PORT, () =>
    console.log(`⚙️ server is running on port: ${process.env.PORT}`))
}
).catch((err) => {
  console.log("mongodb connection failed", err);
})