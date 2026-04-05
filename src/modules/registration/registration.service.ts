/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../app/lib/prisma.js";
import { RegistrationStatus } from "../../generated/prisma/enums.js";

// Register to event
const registerToEvent = async (userId: string, eventId: string, status?: RegistrationStatus) => {
  // Fetch event
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.isDeleted) throw new Error("Event not found");

  // Prevent duplicate registrations
  const existing = await prisma.registration.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (existing) throw new Error("Already registered for this event");

  // Determine status
  let registrationStatus: RegistrationStatus = RegistrationStatus.PENDING;
  if (status) {
    registrationStatus = status;
  } else if (event.isPublic) {
    registrationStatus = RegistrationStatus.APPROVED;
  }

  // Create registration
  return prisma.registration.create({
    data: { userId, eventId, status: registrationStatus },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      },
      event: {
        select: { id: true, title: true, date: true, venue: true, fee: true, createdAt: true, updatedAt: true },
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
};