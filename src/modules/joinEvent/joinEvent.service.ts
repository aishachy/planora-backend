import { prisma } from "../../lib/prisma";

export const joinEventService = {
  // Join Event (Simple)
  joinEvent: async (payload: { userId: string; eventId: string }) => {
    const { userId, eventId } = payload;

    // prevent duplicate
    const existing = await prisma.registration.findFirst({
      where: {
        userId,
        eventId,
      },
    });

    if (existing) {
      throw new Error("You already joined this event");
    }

    const registration = await prisma.registration.create({
      data: {
        userId,
        eventId,
      },
    });

    return registration;
  },

  // Get all registrations
  getAllRegistrations: async () => {
    return prisma.registration.findMany({
      include: {
        user: true,
        event: true,
      },
      orderBy: {
        registrationDate: "desc",
      },
    });
  },

  // Get my registrations
  getMyRegistrations: async (userId: string) => {
    return prisma.registration.findMany({
      where: { userId },
      include: {
        event: true,
      },
      orderBy: {
        registrationDate: "desc",
      },
    });
  },

  // Delete registration
  deleteRegistration: async (id: string) => {
    await prisma.registration.delete({
      where: { id },
    });

    return { message: "Registration deleted successfully" };
  },
};