import { prisma } from "../../app/lib/prisma.js";

// ========================
// SEND INVITATION
// ========================
const sendInvitation = async (
  eventId: string,
  userId: string,
  inviterId: string,
  inviterRole: string
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new Error("Event not found");

  if (event.organizerId !== inviterId && inviterRole !== "ADMIN") {
    throw new Error("Only organizer can invite");
  }

  const existingInvitation = await prisma.invitation.findFirst({
    where: { eventId, userId },
  });

  if (existingInvitation) {
    throw new Error("Invitation already sent");
  }

  const alreadyRegistered = await prisma.registration.findFirst({
    where: { eventId, userId },
  });

  if (alreadyRegistered) {
    throw new Error("User already registered");
  }

  const registration = await prisma.registration.create({
    data: {
      userId,
      eventId,
      status: "PENDING",
    },
  });

  return prisma.invitation.create({
    data: {
      eventId,
      userId,
      inviterId,
      status: "PENDING",
      registrationId: registration.id,
    },
  });
};

// ========================
// GET MY INVITATIONS
// ========================
const getMyInvitations = async (userId: string) => {
  return prisma.invitation.findMany({
    where: { userId },

    include: {
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

    orderBy: {
      createdAt: "desc",
    },
  });
};

// ========================
// GET SENT INVITATIONS
// ========================
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

// ========================
// ACCEPT FREE EVENT
// ========================
const acceptInvitation = async (invitationId: string, userId: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      event: true,
    },
  });

  if (!invitation) throw new Error("Invitation not found");

  if (invitation.userId !== userId) throw new Error("Unauthorized");

  if (invitation.status !== "PENDING") {
    throw new Error("Invitation already processed");
  }

  if (invitation.event.isPaid) {
    throw new Error("This is a paid event. Payment required.");
  }

  await prisma.registration.update({
    where: { id: invitation.registrationId! },
    data: { status: "ACCEPTED" },
  });

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "ACCEPTED" },
  });
};

// ========================
// REJECT INVITATION
// ========================
const rejectInvitation = async (invitationId: string, userId: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) throw new Error("Invitation not found");

  if (invitation.userId !== userId) throw new Error("Unauthorized");

  if (
    invitation.status === "ACCEPTED" ||
    invitation.status === "REJECTED"
  ) {
    throw new Error("Invitation already processed");
  }

  await prisma.registration.update({
    where: { id: invitation.registrationId! },
    data: { status: "REJECTED" },
  });

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "REJECTED" },
  });
};

// ========================
// ORGANIZER APPROVES PAYMENT
// ========================
const approvePaymentInvitation = async (
  invitationId: string,
  userId: string
) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      event: true,
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.inviterId !== userId) {
    throw new Error("Only organizer can approve");
  }



  await prisma.registration.update({
    where: { id: invitation.registrationId! },
    data: { status: "ACCEPTED" },
  });

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "ACCEPTED" },
  });
};

// ========================
export const invitationService = {
  sendInvitation,
  getMyInvitations,
  getSentInvitations,
  acceptInvitation,
  rejectInvitation,
  approvePaymentInvitation,
};