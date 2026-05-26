import { prisma } from "../../app/lib/prisma.js";

// SEND INVITATION
const sendInvitation = async (
  eventId: string,
  userId: string,
  inviterId: string,
  inviterRole: string // pass the role as a parameter
) => {
  // CHECK EVENT
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // ONLY ORGANIZER CAN INVITE
  if (
    event.organizerId !== inviterId &&
    inviterRole !== "ADMIN"
  ) {
    throw new Error(
      "Only organizer can invite"
    );
  }

  // PREVENT DUPLICATE INVITATION
  const existingInvitation =
    await prisma.invitation.findFirst({
      where: {
        eventId,
        userId,
      },
    });

  if (existingInvitation) {
    throw new Error(
      "Invitation already sent"
    );
  }

  // PREVENT INVITING ALREADY REGISTERED USER
  const alreadyRegistered =
    await prisma.registration.findFirst({
      where: {
        eventId,
        userId,
      },
    });

  if (alreadyRegistered) {
    throw new Error(
      "User already registered"
    );
  }

  // CREATE INVITATION
  return prisma.invitation.create({
    data: {
      eventId,
      userId,
      inviterId,
      status: "PENDING",
    },
  });
};

// GET MY INVITATIONS
const getMyInvitations = async (
  userId: string
) => {
  return prisma.invitation.findMany({
    where: {
      event: {
        organizerId: userId,
      }
    },

    select: {
      id: true,
      status: true, 
      createdAt: true,

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

const getSentInvitations = async (userId: string) => {
  return prisma.invitation.findMany({
    where: {
      event: {
        organizerId: userId,
      },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
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
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// ACCEPT INVITATION
// FREE EVENTS ONLY
const acceptInvitation = async (
  invitationId: string,
  userId: string
) => {
  const invitation =
    await prisma.invitation.findUnique({
      where: { id: invitationId },

      include: {
        event: true,
      },
    });

  // CHECK INVITATION
  if (!invitation) {
    throw new Error(
      "Invitation not found"
    );
  }

  // CHECK OWNER
  if (invitation.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // PREVENT ACTION ON COMPLETED INVITATION
  if (invitation.status !== "PENDING") {
    throw new Error(
      "Invitation already processed"
    );
  }

  // PAID EVENT CANNOT USE NORMAL ACCEPT
  if (invitation.event.isPaid) {
    throw new Error(
      "This is a paid event. Use Pay & Accept."
    );
  }

  // PREVENT DUPLICATE REGISTRATION
  const alreadyRegistered =
    await prisma.registration.findFirst({
      where: {
        userId,
        eventId: invitation.eventId,
      },
    });

  if (alreadyRegistered) {
    throw new Error(
      "Already registered for this event"
    );
  }

  // CREATE REGISTRATION
  await prisma.registration.create({
    data: {
      userId,
      eventId: invitation.eventId,
      status: "APPROVED",
    },
  });

  // UPDATE INVITATION
  return prisma.invitation.update({
    where: { id: invitationId },

    data: {
      status: "ACCEPTED",
    },
  });
};

// REJECT INVITATION
const rejectInvitation = async (
  invitationId: string,
  userId: string
) => {
  const invitation =
    await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

  // CHECK INVITATION
  if (!invitation) {
    throw new Error(
      "Invitation not found"
    );
  }

  // CHECK OWNER
  if (invitation.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // PREVENT DOUBLE ACTION
  if (invitation.status !== "PENDING") {
    throw new Error(
      "Invitation already processed"
    );
  }

  // UPDATE STATUS
  return prisma.invitation.update({
    where: { id: invitationId },

    data: {
      status: "REJECTED",
    },
  });
};

// PAY & ACCEPT INVITATION
const payAndAcceptInvitation = async (
  invitationId: string,
  userId: string
) => {
  const invitation =
    await prisma.invitation.findUnique({
      where: { id: invitationId },

      include: {
        event: true,
      },
    });

  // CHECK INVITATION
  if (!invitation) {
    throw new Error(
      "Invitation not found"
    );
  }

  // CHECK OWNER
  if (invitation.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // PREVENT DOUBLE ACTION
  if (invitation.status !== "PENDING") {
    throw new Error(
      "Invitation already processed"
    );
  }

  // MUST BE PAID EVENT
  if (!invitation.event.isPaid) {
    throw new Error(
      "This event is free. Use Accept instead."
    );
  }

  // PREVENT DUPLICATE REGISTRATION
  const alreadyRegistered =
    await prisma.registration.findFirst({
      where: {
        userId,
        eventId: invitation.eventId,
      },
    });

  if (alreadyRegistered) {
    throw new Error(
      "Already registered for this event"
    );
  }

  // PAYMENT SUCCESS
  // IN FUTURE:
  // Stripe / SSLCommerz / SurjoPay

  // CREATE REGISTRATION
  await prisma.registration.create({
    data: {
      userId,
      eventId: invitation.eventId,
      status: "APPROVED",
    },
  });

  // UPDATE INVITATION
  return prisma.invitation.update({
    where: { id: invitationId },

    data: {
      status: "ACCEPTED",
    },
  });
};

export const invitationService = {
  sendInvitation,
  getMyInvitations,
  getSentInvitations,
  acceptInvitation,
  rejectInvitation,
  payAndAcceptInvitation,
};