import { Router } from "express";
import { userController } from "./user.controller.js";

const router = Router();


router.post("/", userController.createUser);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.patch("/:id/ban", userController.banUser);
router.patch("/:id/unban", userController.unbanUser);

export const userRouter = router;