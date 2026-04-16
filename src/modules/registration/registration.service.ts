/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../app/lib/prisma.js";
import { RegistrationStatus } from "../../generated/prisma/enums.js";

// Register to event
const registerToEvent = async (
  userId: string,
  eventId: string,
  status?: RegistrationStatus
) => {
  /* =========================
     1. CHECK USER (BAN CHECK HERE)
  ========================= */
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  if (user.isBanned) {
    throw new Error("You are banned from registering to events");
  }

  /* =========================
     2. FETCH EVENT
  ========================= */
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event || event.isDeleted) {
    throw new Error("Event not found");
  }

  /* =========================
     3. CHECK DUPLICATE REGISTRATION
  ========================= */
  const existing = await prisma.registration.findUnique({
    where: {
      userId_eventId: { userId, eventId },
    },
  });

  if (existing) {
    if (existing.status === RegistrationStatus.REJECTED) {
      // allow re-apply
    } else {
      throw new Error("Already registered for this event");
    }
  }

  const blocked = await prisma.registration.findFirst({
    where: {
      userId,
      eventId,
      status: "BLOCKED",
    },
  });

  if (blocked) {
    throw new Error("You are blocked from this event");
  }

  /* =========================
     4. DETERMINE STATUS (CORE LOGIC)
  ========================= */
  let registrationStatus: RegistrationStatus;

  if (status) {
    registrationStatus = status;
  } else {
    // PRIVATE EVENT → always pending
    if (!event.isPublic) {
      registrationStatus = RegistrationStatus.PENDING;
    }

    // PUBLIC FREE EVENT → auto approve
    else if (event.isPublic && !event.isPaid) {
      registrationStatus = RegistrationStatus.APPROVED;
    }

    // PUBLIC PAID EVENT → wait for payment
    else if (event.isPublic && event.isPaid) {
      registrationStatus = RegistrationStatus.PENDING;
    }

    // fallback
    else {
      registrationStatus = RegistrationStatus.PENDING;
    }
  }

  /* =========================
     5. CREATE REGISTRATION
  ========================= */
  return prisma.registration.create({
    data: {
      userId,
      eventId,
      status: registrationStatus,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          date: true,
          venue: true,
          fee: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
};

// Get all registrations
const getAllRegistrations = async () =>
  prisma.registration.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      event: { select: { id: true, title: true, date: true, venue: true, fee: true } },
    },
  });

// Get registrations for a specific user
const getMyRegistrations = async (userId: string) =>
  prisma.registration.findMany({
    where: { userId },
    include: {
      event: { select: { id: true, title: true, date: true, venue: true, fee: true } },
    },
  });

// Approve registration
const approveRegistration = async (id: string) =>
  prisma.registration.update({
    where: { id },
    data: { status: RegistrationStatus.APPROVED },
  });

// Reject registration
const rejectRegistration = async (id: string) =>
  prisma.registration.update({
    where: { id },
    data: { status: RegistrationStatus.REJECTED },
  });

const banParticipant = async (
  userId: string,
  eventId: string,
  ownerId: string
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new Error("Event not found");

  if (event.organizerId !== ownerId) {
    throw new Error("Not allowed");
  }

  const registration = await prisma.registration.findUnique({
    where: {
      userId_eventId: { userId, eventId },
    },
  });

  if (registration) {
    return prisma.registration.update({
      where: { id: registration.id },
      data: { status: "BLOCKED" },
    });
  }

  return prisma.registration.create({
    data: {
      userId,
      eventId,
      status: "BLOCKED",
    },
  });
};

// Delete registration
const deleteRegistration = async (id: string) =>
  prisma.registration.delete({ where: { id } });

export const registrationService = {
  registerToEvent,
  getAllRegistrations,
  getMyRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
  banParticipant
};