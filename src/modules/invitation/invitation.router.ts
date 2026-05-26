import express from "express";
// import auth from "../../middleware/auth";
import { invitationController } from "./invitation.controller.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

router.post("/", auth("ADMIN", "USER"), invitationController.sendInvitation);
router.post("/pay/:id", auth("ADMIN", "USER"), invitationController.payAndAccept);
router.get("/me", auth("ADMIN", "USER"), invitationController.getMyInvitations);
router.get("/sentInvitations", auth("ADMIN", "USER"), invitationController.getSentInvitations);
router.patch("/:id/accept", auth("ADMIN", "USER"), invitationController.acceptInvitation);
router.patch("/:id/reject", auth("ADMIN", "USER"), invitationController.rejectInvitation);

export const invitationRouter = router;
