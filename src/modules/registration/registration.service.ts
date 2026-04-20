/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../app/lib/prisma.js";
import { RegistrationStatus } from "../../generated/prisma/enums.js";

/* =====================================================
   REGISTER TO EVENT
===================================================== */
const registerToEvent = async (
  userId: string,
  eventId: string,
  status?: RegistrationStatus
) => {
  // 1. CHECK USER
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  if (user.isBanned) {
    throw new Error("You are banned from registering to events");
  }

  // 2. FETCH EVENT
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event || event.isDeleted) {
    throw new Error("Event not found");
  }

  // 🚫 Prevent owner registering own event
  if (event.organizerId === userId) {
    throw new Error("You cannot register for your own event");
  }

  // 3. BLOCK CHECK (FIRST)
  const blocked = await prisma.registration.findFirst({
    where: {
      userId,
      eventId,
      status: RegistrationStatus.BLOCKED,
    },
  });

  if (blocked) {
    throw new Error("You are blocked from this event");
  }

  // 4. CHECK EXISTING REGISTRATION
  const existing = await prisma.registration.findUnique({
    where: {
      userId_eventId: { userId, eventId },
    },
  });

  // 5. DETERMINE STATUS
  let registrationStatus: RegistrationStatus;

  if (status) {
    registrationStatus = status;
  } else if (!event.isPublic) {
    registrationStatus = RegistrationStatus.PENDING;
  } else if (event.isPublic && !event.isPaid) {
    registrationStatus = RegistrationStatus.APPROVED;
  } else {
    registrationStatus = RegistrationStatus.PENDING;
  }

  // 6. HANDLE RE-APPLY (IMPORTANT FIX)
  if (existing) {
    if (existing.status === RegistrationStatus.REJECTED) {
      return prisma.registration.update({
        where: {
          userId_eventId: { userId, eventId },
        },
        data: {
          status: registrationStatus,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              date: true,
              venue: true,
              fee: true,
            },
          },
        },
      });
    }

    throw new Error("Already registered for this event");
  }

  // 7. CREATE NEW REGISTRATION
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
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          date: true,
          venue: true,
          fee: true,
        },
      },
    },
  });
};

/* =====================================================
   GET ALL REGISTRATIONS
===================================================== */
const getAllRegistrations = async () =>
  prisma.registration.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      event: { select: { id: true, title: true, date: true, venue: true, fee: true } },
    },
  });

/* =====================================================
   GET MY REGISTRATIONS
===================================================== */
const getMyRegistrations = async (userId: string) =>
  prisma.registration.findMany({
    where: { userId },
    include: {
      event: { select: { id: true, title: true, date: true, venue: true, fee: true } },
    },
  });

/* =====================================================
   GET EVENT REGISTRATIONS (FOR OWNER DASHBOARD)
===================================================== */
const getEventRegistrations = async (eventId: string) =>
  prisma.registration.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

/* =====================================================
   APPROVE REGISTRATION (OWNER ONLY)
===================================================== */
const approveRegistration = async (id: string, ownerId: string) => {
  const registration = await prisma.registration.findUnique({
    where: { id },
    include: { event: true },
  });

  if (!registration) throw new Error("Registration not found");

  if (registration.event.organizerId !== ownerId) {
    throw new Error("Not authorized");
  }

  return prisma.registration.update({
    where: { id },
    data: { status: RegistrationStatus.APPROVED },
  });
};

/* =====================================================
   REJECT REGISTRATION (OWNER ONLY)
===================================================== */
const rejectRegistration = async (id: string, ownerId: string) => {
  const registration = await prisma.registration.findUnique({
    where: { id },
    include: { event: true },
  });

  if (!registration) throw new Error("Registration not found");

  if (registration.event.organizerId !== ownerId) {
    throw new Error("Not authorized");
  }

  return prisma.registration.update({
    where: { id },
    data: { status: RegistrationStatus.REJECTED },
  });
};

/* =====================================================
   BAN PARTICIPANT (OWNER ONLY)
===================================================== */
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
    throw new Error("Not authorized");
  }

  const registration = await prisma.registration.findUnique({
    where: {
      userId_eventId: { userId, eventId },
    },
  });

  if (registration) {
    return prisma.registration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatus.BLOCKED },
    });
  }

  return prisma.registration.create({
    data: {
      userId,
      eventId,
      status: RegistrationStatus.BLOCKED,
    },
  });
};

/* =====================================================
   DELETE REGISTRATION
===================================================== */
const deleteRegistration = async (id: string) =>
  prisma.registration.delete({ where: { id } });

/* =====================================================
   EXPORT SERVICE
===================================================== */
export const registrationService = {
  registerToEvent,
  getAllRegistrations,
  getMyRegistrations,
  getEventRegistrations,
  approveRegistration,
  rejectRegistration,
  banParticipant,
  deleteRegistration,
};