import { prisma } from "../../app/lib/prisma";

const getAllUsers = async () => {
  return prisma.user.findMany({
    where: { isDeleted: false },
  });
};

const deleteUser = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};



const getAllEvents = async () => {
  return prisma.event.findMany({
    include: {
      organizer: true,
    },
  });
};

const deleteEvent = async (eventId: string) => {
  return prisma.event.update({
    where: { id: eventId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};



const getAllRegistrations = async () => {
  return prisma.registration.findMany({
    include: {
      user: true,
      event: true,
    },
  });
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


const deleteReview = async (id: string) => {
  return prisma.review.delete({
    where: { id },
  });
};



const getDashboardStats = async () => {
  const users = await prisma.user.count();
  const events = await prisma.event.count();
  const registrations = await prisma.registration.count();
  const reviews = await prisma.review.count();

  return {
    users,
    events,
    registrations,
    reviews,
  };
};

export const adminService = {
  getAllUsers,
  deleteUser,
  getAllEvents,
  deleteEvent,
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteReview,
  getDashboardStats,
};