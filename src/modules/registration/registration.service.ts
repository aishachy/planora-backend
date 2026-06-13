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

  // 3. CHECK BLOCKED USERS
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

  // 5. DETERMINE INITIAL REGISTRATION STATUS
  // IMPORTANT: This is ONLY initial state before payment/approval
  let registrationStatus: RegistrationStatus;

  if (status) {
    registrationStatus = status;
  } else {
    // Free public events → auto approved
    if (event.isPublic && !event.isPaid) {
      registrationStatus = RegistrationStatus.APPROVED;
    }
    // ALL paid events → always pending (waiting for payment)
    else {
      registrationStatus = RegistrationStatus.PENDING;
    }
  }

  // 6. HANDLE EXISTING REGISTRATION
  if (existing) {
    if (existing.status === RegistrationStatus.BLOCKED) {
      throw new Error("You are blocked from this event");
    }

    // allow reapply if rejected
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
              isPaid: true,
              isPublic: true,
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
          isPaid: true,
          isPublic: true,
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

      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          transactionId: true,
          invoiceUrl: true,
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
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.organizerId !== ownerId) {
    throw new Error("Not authorized");
  }

  return prisma.registration.findMany({
    where: {
      eventId,
      ...(status && { status }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          transactionId: true,
          createdAt: true,
        },
      },
    },
  });
};
export const getRegistrationById = async (
  userId: string,
  eventId: string
) => {
  const registration = await prisma.registration.findFirst({
    where: {
      userId,
      eventId,
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
          isPaid: true,
          isPublic: true,
        },
      },
      payment: true,
    },
  });

  if (!registration) {
    throw new Error("Registration not found");
  }

  return registration;
};

/* =====================================================
   APPROVE REGISTRATION (OWNER)
===================================================== */
const approveRegistration = async (
  id: string,
  ownerId: string
) => {
  const registration =
    await prisma.registration.findUnique({
      where: { id },
      include: {
        event: true,
        payment: true,
      },
    });

  if (!registration) {
    throw new Error("Registration not found");
  }

  if (
    registration.event.organizerId !== ownerId
  ) {
    throw new Error("Not authorized");
  }

  // For paid events, verify payment first
  if (registration.event.isPaid) {
    const hasCompletedPayment =
      registration.payment.some(
        (p) => p.status === "COMPLETED"
      );

    if (!hasCompletedPayment) {
      throw new Error(
        "Payment not completed"
      );
    }
  }

  const updated =
    await prisma.registration.update({
      where: { id },
      data: {
        status:
          RegistrationStatus.APPROVED,
      },
    });

  await prisma.invitation.updateMany({
    where: {
      eventId: registration.eventId,
      userId: registration.userId,
    },
    data: {
      status: "ACCEPTED",
    },
  });

  return updated;
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

  const updated = await prisma.registration.update({
    where: { id },
    data: {
      status: RegistrationStatus.REJECTED,
    },
  });

  await prisma.invitation.updateMany({
    where: {
      eventId: registration.eventId,
      userId: registration.userId,
    },
    data: {
      status: "REJECTED",
    },
  });

  return updated;
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
  getRegistrationById,
};