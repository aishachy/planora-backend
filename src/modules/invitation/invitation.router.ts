import express from "express";
// import auth from "../../middleware/auth";
import { invitationController } from "./invitation.controller";

const router = express.Router();

router.post("/", invitationController.sendInvitation);
router.get("/me", invitationController.getMyInvitations);
router.patch("/:id/accept", invitationController.acceptInvitation);
router.patch("/:id/reject", invitationController.rejectInvitation);

export const invitationRouter = router;

// auth("USER", "ADMIN"),