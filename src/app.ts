import express, { Request, Response } from "express"
import { authRouter } from "./modules/auth/auth.router.js";
import cookieParser from "cookie-parser";
import { userRouter } from "./modules/user/user.router.js";
import { eventRouter } from "./modules/event/event.router.js";
import { reviewRouter } from "./modules/review/review.router.js";
import { paymentRouter } from "./modules/payment/payment.router.js";
import { adminRouter } from "./modules/admin/admin.router.js";
import { registrationRouter } from "./modules/registration/registration.router.js";


const app = express();

app.use(express.urlencoded({ extended: true }));


app.use("/api/payment", paymentRouter);

app.use(express.json())
app.use(cookieParser());

app.use('/api/auth', authRouter)

app.use('/api/user', userRouter)

app.use('/api/event', eventRouter)

app.use('/api/registration', registrationRouter)

app.use('/api/review', reviewRouter)

app.use('/api/admin', adminRouter)



app.get('/', (req: Request, res: Response) => {
    res.send("Hello, Typescript + Express!!");
})

export default app;