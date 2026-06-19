import { prisma } from "../../app/lib/prisma.js";
import { RegistrationStatus } from "../../generated/prisma/enums.js";

/* =========================
   REGISTER
========================= */
const registerToEvent = async (userId: string, eventId: string, status?: RegistrationStatus) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isBanned: true },
  });

  if (!user) throw new Error("User not found");
  if (user.isBanned) throw new Error("You are banned");

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizerId: true, isDeleted: true, isPaid: true, isPublic: true },
  });

  if (!event || event.isDeleted) throw new Error("Event not found");
  if (event.organizerId === userId) throw new Error("Cannot register own event");

  const existing = await prisma.registration.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  const registrationStatus =
    status ??
    (event.isPublic && !event.isPaid
      ? RegistrationStatus.ACCEPTED
      : RegistrationStatus.PENDING);

  if (existing) {
    if (existing.status === RegistrationStatus.BLOCKED) {
      throw new Error("Blocked");
    }

    if (existing.status === RegistrationStatus.REJECTED) {
      return prisma.registration.update({
        where: { userId_eventId: { userId, eventId } },
        data: { status: registrationStatus },
      });
    }

    throw new Error("Already registered");
  }

  return prisma.registration.create({
    data: { userId, eventId, status: registrationStatus },
  });
};

/* =========================
   GET ALL
========================= */
const getAllRegistrations = async () => {
  return prisma.registration.findMany({
    select: { id: true, status: true, userId: true, eventId: true },
  });
};

/* =========================
   GET MY
========================= */
const getMyRegistrations = async (userId: string) => {
  return prisma.registration.findMany({
    where: { userId, event: { isDeleted: false } },
    select: {
      id: true,
      status: true,
      event: {
        select: { id: true, title: true, date: true, venue: true, fee: true },
      },
    },
  });
};

/* =========================
   EVENT REGISTRATIONS
========================= */
const getEventRegistrations = async (eventId: string, ownerId: string, status?: RegistrationStatus) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });

  if (!event) throw new Error("Event not found");
  if (event.organizerId !== ownerId) throw new Error("Unauthorized");

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

/* =========================
   GET BY ID
========================= */
const getRegistrationById = async (userId: string, eventId: string) => {
  const registration = await prisma.registration.findFirst({
    where: { userId, eventId },
    include: {
      event: true,
    },
  });

  if (!registration) throw new Error("Registration not found");
  return registration;
};

/* =========================
   APPROVE
========================= */
const approveRegistration = async (id: string, ownerId: string) => {
  const registration = await prisma.registration.findUnique({
    where: { id },
    include: { event: true },
  });

  if (!registration) throw new Error("Not found");
  if (registration.event.organizerId !== ownerId) throw new Error("Unauthorized");

  await prisma.invitation.updateMany({
    where: {
      eventId: registration.eventId,
      userId: registration.userId,
    },
    data: { status: "ACCEPTED" },
  });

  return prisma.registration.update({
    where: { id },
    data: { status: RegistrationStatus.ACCEPTED },
  });
};

/* =========================
   REJECT
========================= */
const rejectRegistration = async (id: string, ownerId: string) => {
  const registration = await prisma.registration.findUnique({
    where: { id },
    include: { event: true },
  });

  if (!registration) throw new Error("Not found");
  if (registration.event.organizerId !== ownerId) throw new Error("Unauthorized");

  return prisma.registration.update({
    where: { id },
    data: { status: RegistrationStatus.REJECTED },
  });
};

/* =========================
   BAN / UNBAN
========================= */
const banParticipant = async (userId: string, eventId: string, ownerId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (event?.organizerId !== ownerId) throw new Error("Unauthorized");

  return prisma.registration.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: { status: RegistrationStatus.BLOCKED },
    create: { userId, eventId, status: RegistrationStatus.BLOCKED },
  });
};

const unbanParticipant = async (userId: string, eventId: string, ownerId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (event?.organizerId !== ownerId) throw new Error("Unauthorized");

  return prisma.registration.update({
    where: { userId_eventId: { userId, eventId } },
    data: { status: RegistrationStatus.PENDING },
  });
};

/* =========================
   DELETE (FIXED MISSING FUNCTION)
========================= */
const deleteRegistration = async (id: string) => {
  return prisma.registration.delete({
    where: { id },
  });
};

/* =========================
   EXPORT
========================= */
export const registrationService = {
  registerToEvent,
  getAllRegistrations,
  getMyRegistrations,
  getEventRegistrations,
  getRegistrationById,
  approveRegistration,
  rejectRegistration,
  banParticipant,
  unbanParticipant,
  deleteRegistration,
};