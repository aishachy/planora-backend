/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { invitationService } from "./invitation.service.js";
import { prisma } from "../../lib/prisma.js";

// =========================
// SEND INVITATION
// =========================
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

// =========================
// GET MY INVITATIONS
// =========================
const getMyInvitations = async (userId: string) => {
  return prisma.invitation.findMany({
    where: { userId },

    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          date: true,
          venue: true,
          isPaid: true,
          fee: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

// =========================
// ACCEPT INVITATION (FIXED PARAM)
// =========================
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

// =========================
// REJECT INVITATION (FIXED PARAM)
// =========================
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

// =========================
// PAY & ACCEPT
// =========================
const approvePaymentInvitation = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const invitationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const data = await invitationService.approvePaymentInvitation(
      invitationId,
      userId
    );

    res.json({
      success: true,
      message: "Payment approved by organizer",
      data,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const getSentInvitations = async (
  req: Request,
  res: Response
) => {
  try {
    const inviterId = req.user!.id;

    const data =
      await invitationService.getSentInvitations(
        inviterId
      );

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

export const invitationController = {
  sendInvitation,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
  approvePaymentInvitation,
  getSentInvitations,
};