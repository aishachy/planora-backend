import { prisma } from "../../app/lib/prisma.js";
import { InvitationStatus, RegistrationStatus } from "../../generated/prisma/enums.js";

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

  const registration = await prisma.registration.create({
    data: {
      userId,
      eventId,
      status: RegistrationStatus.PENDING,
    },
  });

  return prisma.invitation.create({
    data: {
      eventId,
      userId,
      inviterId,
      status: InvitationStatus.PENDING,
      registrationId: registration.id,
    },
  });
};

/* =========================
   GET MY INVITATIONS
========================= */
const getMyInvitations = async (userId: string) => {
  return prisma.invitation.findMany({
    where: { userId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      registrationId: true,
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
      inviter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

/* =========================
   ACCEPT INVITATION
========================= */
const acceptInvitation = async (invitationId: string, userId: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      event: true,
    },
  });

  if (!invitation) throw new Error("Not found");
  if (invitation.userId !== userId) throw new Error("Unauthorized");
  if (invitation.status !== InvitationStatus.PENDING) {
    throw new Error("Already processed");
  }

  if (invitation.event.isPaid) {
    throw new Error("Payment required");
  }

  if (!invitation.registrationId) {
    throw new Error("Registration missing");
  }

  await prisma.registration.update({
    where: { id: invitation.registrationId },
    data: { status: RegistrationStatus.ACCEPTED },
  });

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.ACCEPTED },
  });
};

/* =========================
   REJECT INVITATION
========================= */
const rejectInvitation = async (invitationId: string, userId: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) throw new Error("Not found");
  if (invitation.userId !== userId) throw new Error("Unauthorized");

  if (!invitation.registrationId) {
    throw new Error("Registration missing");
  }

  await prisma.registration.update({
    where: { id: invitation.registrationId },
    data: { status: RegistrationStatus.REJECTED },
  });

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.REJECTED },
  });
};

/* =========================
   APPROVE PAYMENT (KEEP SAFE)
========================= */
const approvePaymentInvitation = async (
  invitationId: string,
  userId: string
) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) throw new Error("Not found");
  if (invitation.inviterId !== userId) throw new Error("Not authorized");

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.ACCEPTED },
  });
};

export const invitationService = {
  sendInvitation,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
  approvePaymentInvitation,
};