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

  // Prevent owner registering own event
  if (event.organizerId === userId) {
    throw new Error("You cannot register for your own event");
  }

  // 3. CHECK BLOCK FIRST
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

  // 6. HANDLE EXISTING
  if (existing) {
    //  Blocked users can NEVER reapply
    if (existing.status === RegistrationStatus.BLOCKED) {
      throw new Error("You are blocked from this event");
    }

    //  Allow reapply if rejected
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

  // 7. CREATE NEW
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
   GET ALL REGISTRATIONS (ADMIN)
===================================================== */
const getAllRegistrations = async () =>
  prisma.registration.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      event: {
        select: { id: true, title: true, date: true, venue: true, fee: true },
      },
    },
  });

/* =====================================================
   GET MY REGISTRATIONS (USER)
===================================================== */
const getMyRegistrations = async (userId: string) =>
  prisma.registration.findMany({
    where: {
      userId,
      event: {
        isDeleted: false, 
      },
    },
    include: {
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

/* =====================================================
   GET EVENT REGISTRATIONS (OWNER ONLY)
   + FILTER BY STATUS
===================================================== */
const getEventRegistrations = async (
  eventId: string,
  ownerId: string,
  status?: RegistrationStatus
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new Error("Event not found");

  if (event.organizerId !== ownerId) {
    throw new Error("Not authorized");
  }

  return prisma.registration.findMany({
    where: {
      eventId,
      ...(status && { status }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

/* =====================================================
   APPROVE REGISTRATION (OWNER)
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
   REJECT REGISTRATION (OWNER)
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
   BAN PARTICIPANT (OWNER)
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
   UNBAN PARTICIPANT (NEW)
===================================================== */
const unbanParticipant = async (
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

  return prisma.registration.update({
    where: {
      userId_eventId: { userId, eventId },
    },
    data: {
      status: RegistrationStatus.REJECTED,
    },
  });
};

/* =====================================================
   DELETE REGISTRATION
===================================================== */
const deleteRegistration = async (id: string) =>
  prisma.registration.delete({ where: { id } });

/* =====================================================
   EXPORT
===================================================== */
export const registrationService = {
  registerToEvent,
  getAllRegistrations,
  getMyRegistrations,
  getEventRegistrations,
  approveRegistration,
  rejectRegistration,
  banParticipant,
  unbanParticipant, 
  deleteRegistration,
};