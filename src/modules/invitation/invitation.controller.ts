/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { invitationService } from "./invitation.service.js";

// ========================
// SEND INVITATION
// ========================
const sendInvitation = async (req: Request, res: Response) => {
  try {
    const inviterId = req.user!.id;
    const inviterRole = req.user!.role;
    const { eventId, userId } = req.body;

    const data = await invitationService.sendInvitation(
      eventId,
      userId,
      inviterId,
      inviterRole
    );

    return res.status(201).json({
      success: true,
      message: "Invitation sent",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ========================
// GET MY INVITATIONS
// ========================
const getMyInvitations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const data = await invitationService.getMyInvitations(userId);

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ========================
// ACCEPT INVITATION
// ========================
const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const invitationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const data = await invitationService.acceptInvitation(
      invitationId,
      userId
    );

    return res.json({
      success: true,
      message: "Invitation accepted",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ========================
// REJECT INVITATION
// ========================
const rejectInvitation = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const invitationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const data = await invitationService.rejectInvitation(
      invitationId,
      userId
    );

    return res.json({
      success: true,
      message: "Invitation rejected",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ========================
// PAY & ACCEPT INVITATION
// ========================
const payAndAccept = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const invitationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const data = await invitationService.payAndAcceptInvitation(
      invitationId,
      userId
    );

    return res.json({
      success: true,
      message: "Payment successful & invitation processed",
      data,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ========================
// EXPORT
// ========================
export const invitationController = {
  sendInvitation,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
  payAndAccept,
};