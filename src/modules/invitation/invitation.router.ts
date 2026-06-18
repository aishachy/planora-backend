import express from "express";
import auth from "../../middleware/auth.js";
import { invitationController } from "./invitation.controller.js";

const router = express.Router();

// CREATE INVITATION
router.post("/", auth("ADMIN", "USER"), invitationController.sendInvitation);

// GET MY INVITATIONS
router.get("/me", auth("ADMIN", "USER"), invitationController.getMyInvitations);

// OPTIONAL ALIAS (FIX YOUR FRONTEND ISSUE)
router.get(
  "/sendInvitation",
  auth("ADMIN", "USER"),
  invitationController.getMyInvitations
);

// ACCEPT / REJECT
router.patch("/:id/accept", auth("ADMIN", "USER"), invitationController.acceptInvitation);
router.patch("/:id/reject", auth("ADMIN", "USER"), invitationController.rejectInvitation);

// PAY
router.post("/:id/approve-payment", auth("ADMIN", "USER"), invitationController.approvePaymentInvitation);

export const invitationRouter = router;