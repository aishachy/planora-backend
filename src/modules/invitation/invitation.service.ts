import { prisma } from "../../app/lib/prisma.js";

enum InvitationStatus {
  PENDING = "PENDING",
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PENDING_PAYMENT_APPROVAL = "PENDING_PAYMENT_APPROVAL",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

// ========================
// SEND INVITATION (FIXED)
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

  let status: InvitationStatus = InvitationStatus.PENDING;

  if (event.isPaid) {
    status = InvitationStatus.PENDING_PAYMENT;
  }

  // ========================
  // 🔥 STEP 1: CREATE REGISTRATION HERE
  // ========================
  const registration = await prisma.registration.create({
    data: {
      userId,
      eventId,
      status: "PENDING",
    },
  });

  // ========================
  // 🔥 STEP 2: STORE registrationId
  // ========================
  return prisma.invitation.create({
    data: {
      eventId,
      userId,
      inviterId,
      status,
      registrationId: registration.id, // ✔ FIXED
    },
  });
};

// ========================
// GET MY INVITATIONS
// ========================
const getMyInvitations = async (userId: string) => {
  return prisma.invitation.findMany({
    where: { userId },

    select: {
      id: true,
      status: true,
      createdAt: true,

      registrationId: true, // ✔ IMPORTANT FIX

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

    orderBy: { createdAt: "desc" },
  });
};

// ========================
// ACCEPT FREE EVENT
// ========================
const acceptInvitation = async (invitationId: string, userId: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { event: true },
  });

  if (!invitation) throw new Error("Invitation not found");
  if (invitation.userId !== userId) throw new Error("Unauthorized");

  if (invitation.status !== "PENDING") {
    throw new Error("Invitation already processed");
  }

  if (invitation.event.isPaid) {
    throw new Error("This is a paid event. Use Pay & Accept.");
  }

  await prisma.registration.update({
    where: { id: invitation.registrationId! },
    data: {
      status: "APPROVED",
    },
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

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "REJECTED" },
  });
};

// ========================
// PAY & ACCEPT (FIXED)
// ========================
const payAndAcceptInvitation = async (
  invitationId: string,
  userId: string
) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { event: true },
  });

  if (!invitation) throw new Error("Invitation not found");
  if (invitation.userId !== userId) throw new Error("Unauthorized");

  if (invitation.status !== "PENDING_PAYMENT") {
    throw new Error("Invitation already processed");
  }

  if (!invitation.event.isPaid) {
    throw new Error("This event is free. Use Accept instead.");
  }

  if (!invitation.registrationId) {
    throw new Error("Missing registration");
  }

  // ✅ FIX 1: check correct registration properly
  const registration = await prisma.registration.findUnique({
    where: { id: invitation.registrationId },
  });

  if (!registration) {
    throw new Error("Registration not found");
  }

  // (optional safety) ensure correct user-event mapping
  if (registration.userId !== userId) {
    throw new Error("Invalid registration owner");
  }

  // ✅ FIX 2: keep consistent status flow
  await prisma.registration.update({
    where: { id: registration.id },
    data: {
      status: "PENDING", // waiting payment approval
    },
  });

  return prisma.invitation.update({
    where: { id: invitationId },
    data: {
      status: "PENDING_PAYMENT_APPROVAL",
    },
  });
};

export const invitationService = {
  sendInvitation,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
  payAndAcceptInvitation,
};