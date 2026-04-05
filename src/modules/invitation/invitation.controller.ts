/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { invitationService } from "./invitation.service.js";

const sendInvitation = async (req: Request, res: Response) => {
  try {
    const inviterId = req.user!.id;
    const { eventId, userId } = req.body;

    const data = await invitationService.sendInvitation(
      eventId,
      userId,
      inviterId
    );

    res.status(201).json({
      success: true,
      message: "Invitation sent",
      data,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const getMyInvitations = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const data = await invitationService.getMyInvitations(userId);

  res.json({
    success: true,
    data,
  });
};

const acceptInvitation = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const invitationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const data = await invitationService.acceptInvitation(
    invitationId,
    userId
  );

  res.json({
    success: true,
    message: "Invitation accepted",
    data,
  });
};

const rejectInvitation = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const invitationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const data = await invitationService.rejectInvitation(
    invitationId,
    userId
  );

  res.json({
    success: true,
    message: "Invitation rejected",
    data,
  });
};

export const invitationController = {
  sendInvitation,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
};