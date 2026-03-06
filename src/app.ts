import cors from "cors";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser"
import { router } from "./app/routes";
import { globalErrorHandler } from "./app/middlewares/global-error-handler";
import notFound from "./app/middlewares/not-found";

const app = express()
app.use(cors({
    origin: true,
    credentials: true
}))

app.use(cookieParser())
app.use(bodyParser.json())
app.use(express.json())
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }))


//["http://localhost:5173", "https://f-code.vercel.app", "https://fcode.online"]

app.use("/api/v1", router)

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        "🚀": "Welcome to Phi-Lab Server!"
    })
})


app.use(globalErrorHandler)

app.use(notFound)

export default app