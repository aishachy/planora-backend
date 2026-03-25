import express, { Request, Response } from "express"
import { authRouter } from "./modules/auth/auth.router";
import cookieParser from "cookie-parser";
import { userRouter } from "./modules/user/user.router";
import { eventRouter } from "./modules/event/event.router";

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.json())
app.use(cookieParser());

app.use('/api/auth', authRouter)

app.use('/api/user', userRouter)

app.use('/api/event', eventRouter)

app.get('/', (req: Request, res: Response) => {
    res.send("Hello, Typescript + Express!!");
})

export default app;