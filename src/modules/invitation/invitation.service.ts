import { prisma } from "../../app/lib/prisma.js";
import {
  InvitationStatus,
  RegistrationStatus,
} from "../../generated/prisma/enums.js";

/* =========================
   SEND INVITATION
========================= */
const sendInvitation = async (
  eventId: string,
  userId: string,
  inviterId: string,
  inviterRole: string
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event || event.isDeleted) throw new Error("Event not found");

  if (event.organizerId !== inviterId && inviterRole !== "ADMIN") {
    throw new Error("Only organizer can invite");
  }

  const existing = await prisma.invitation.findFirst({
    where: { eventId, userId },
  });

  if (existing) throw new Error("Already invited");

  return prisma.invitation.create({
    data: {
      eventId,
      userId,
      inviterId,
      status: InvitationStatus.PENDING,
    },
  });
};

/* =========================
   GET MY INVITATIONS (RECEIVED)
========================= */
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
      registration: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

/* =========================
   GET SENT INVITATIONS
========================= */
const getSentInvitations = async (inviterId: string) => {
  return prisma.invitation.findMany({
    where: { inviterId },
    include: {
      user: {
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
      registration: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/* =========================
   ACCEPT INVITATION
========================= */
const acceptInvitation = async (
  invitationId: string,
  userId: string
) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { event: true },
  });

  if (!invitation) throw new Error("Not found");

  if (invitation.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    throw new Error("Already processed");
  }

  /* =========================
     CREATE REGISTRATION HERE (FIX)
  ========================= */
  const registration = await prisma.registration.create({
    data: {
      userId: invitation.userId,
      eventId: invitation.eventId,
      status: RegistrationStatus.PENDING,
    },
  });

  /* =========================
     UPDATE INVITATION
  ========================= */
  return prisma.invitation.update({
    where: { id: invitationId },
    data: {
      status: InvitationStatus.ACCEPTED,
      registrationId: registration.id,
    },
  });
};

/* =========================
   REJECT INVITATION
========================= */
const rejectInvitation = async (
  invitationId: string,
  userId: string
) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) throw new Error("Not found");

  if (invitation.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return prisma.invitation.update({
    where: { id: invitationId },
    data: {
      status: InvitationStatus.REJECTED,
    },
  });
};

/* =========================
   APPROVE PAYMENT (ORGANIZER)
========================= */
const approvePaymentInvitation = async (
  invitationId: string,
  userId: string
) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) throw new Error("Not found");

  if (invitation.inviterId !== userId) {
    throw new Error("Not authorized");
  }

  return prisma.invitation.update({
    where: { id: invitationId },
    data: {
      status: InvitationStatus.ACCEPTED,
    },
  });
};

/* =========================
   EXPORT
========================= */
export const invitationService = {
  sendInvitation,
  getMyInvitations,
  getSentInvitations,
  acceptInvitation,
  rejectInvitation,
  approvePaymentInvitation,
};