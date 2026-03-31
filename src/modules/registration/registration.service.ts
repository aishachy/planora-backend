import { prisma } from "../../app/lib/prisma";

const registerToEvent = async (userId: string, eventId: string) => {
  
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.isDeleted) 
    throw new Error("Event not found");

  // Prevent duplicate registrations
  const existing = await prisma.registration.findUnique({
    where: {
      userId_eventId: { userId, eventId },
    },
  });

  if (existing) {
    throw new Error("Already registered for this event");
  }

  // Determine status
  const status = event.isPublic ? "APPROVED" : "PENDING";

  return prisma.registration.create({
    data: {
      userId,
      eventId,
      status,
    },
    include: {
      user: true,
      event: true,
    },
  });
};

const getAllRegistrations = async () => {
  const result = await prisma.registration.findMany({
    include: {
      user: true,
      event: true,
    },
  });
  return result;
};

const getMyRegistrations = async (userId: string) => {
  const result = await prisma.registration.findMany({
    where: { userId },
    include: {
      event: true,
    },
  });
  return result;
};

const approveRegistration = async (id: string) => {
  return prisma.registration.update({
    where: { id },
    data: { status: "APPROVED" },
  });
};

const rejectRegistration = async (id: string) => {
  return prisma.registration.update({
    where: { id },
    data: { status: "REJECTED" },
  });
};

const deleteRegistration = async (id: string) => {
  return prisma.registration.delete({
    where: { id },
  });
};

export const registrationService = {
  registerToEvent,
  getAllRegistrations,
  getMyRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
};