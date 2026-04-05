import express from "express";
import { authController } from "./auth.controller.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

router.post('/login', authController.loginUser)

router.post('/register', authController.registerUser)

router.get('/me', auth(), authController.currentUser)

export const authRouter = router;