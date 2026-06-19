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

  const invitation = await prisma.invitation.create({
    data: {
      eventId,
      userId,
      inviterId,
      status: "PENDING",
      registrationId: registration.id,
    },
  });

  return invitation;
};

// ========================
// GET MY INVITATIONS (SAFE)
// ========================
const getMyInvitations = async (userId: string) => {
  const data = await prisma.invitation.findMany({
    where: { userId },

    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,

      registrationId: true,

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

  return data;
};

// ========================
// GET SENT INVITATIONS (SAFE)
// ========================
const getSentInvitations = async (inviterId: string) => {
  const data = await prisma.invitation.findMany({
    where: { inviterId },

    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,

      registrationId: true,

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

  return data;
};

// ========================
// ACCEPT INVITATION
// ========================
const acceptInvitation = async (invitationId: string, userId: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      userId: true,
      inviterId: true,
      status: true,
      registrationId: true,
      event: {
        select: {
          isPaid: true,
        },
      },
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
  if (!invitation.registrationId) {
  throw new Error("Registration ID missing");
}

await prisma.registration.update({
  where: {
    id: invitation.registrationId, // now guaranteed string
  },
  data: {
    status: "ACCEPTED",
  },
});

  await prisma.registration.update({
    where: { id: invitation.registrationId },
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
    select: {
      id: true,
      userId: true,
      status: true,
      registrationId: true,
    },
  });

  if (!invitation) throw new Error("Invitation not found");

  if (invitation.userId !== userId) throw new Error("Unauthorized");

  if (invitation.status !== "PENDING") {
    throw new Error("Invitation already processed");
  }
  if (!invitation.registrationId) {
    throw new Error("Registration ID missing");
  }

  await prisma.registration.update({
    where: {
      id: invitation.registrationId, // now guaranteed string
    },
    data: {
      status: "ACCEPTED",
    },
  });

  await prisma.registration.update({
    where: { id: invitation.registrationId },
    data: { status: "REJECTED" },
  });

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "REJECTED" },
  });
};

// ========================
// APPROVE PAYMENT INVITATION
// ========================
const approvePaymentInvitation = async (
  invitationId: string,
  userId: string
) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.inviterId !== userId) {
    throw new Error("Only organizer can approve");
  }

  // since you are NOT using registration relation anymore
  if (!invitation.registrationId) {
    throw new Error("Registration not linked to invitation");
  }

  await prisma.registration.update({
    where: { id: invitation.registrationId },
    data: {
      status: "ACCEPTED",
    },
  });

  return prisma.invitation.update({
    where: { id: invitationId },
    data: {
      status: "ACCEPTED",
    },
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