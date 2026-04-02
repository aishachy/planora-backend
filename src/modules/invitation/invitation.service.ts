import { prisma } from "../../app/lib/prisma";

// Send Invitation
const sendInvitation = async (
  eventId: string,
  userId: string,
  inviterId: string
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new Error("Event not found");

  if (event.organizerId !== inviterId) {
    throw new Error("Only organizer can invite");
  }

  return prisma.invitation.create({
    data: {
      eventId,
      userId,
    },
  });
};

// Get My Invitations
const getMyInvitations = async (userId: string) => {
  return prisma.invitation.findMany({
    where: { userId },
    include: {
      event: true,
    },
  });
};

// Accept Invitation
const acceptInvitation = async (invitationId: string, userId: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { event: true },
  });

  if (!invitation) throw new Error("Invitation not found");

  if (invitation.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // If free → auto register
  if (!invitation.event.isPaid) {
    await prisma.registration.create({
      data: {
        userId,
        eventId: invitation.eventId,
        status: "APPROVED",
      },
    });
  }

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "ACCEPTED" },
  });
};

//  Reject Invitation
const rejectInvitation = async (invitationId: string, userId: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) throw new Error("Invitation not found");

  if (invitation.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "REJECTED" },
  });
};

export const invitationService = {
  sendInvitation,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
};