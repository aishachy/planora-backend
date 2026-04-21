import { prisma } from "../../app/lib/prisma.js";

interface EventInput {
    title: string;
    description: string;
    date: Date;
    time: string;
    venue: string;
    isPublic?: boolean;
    isPaid?: boolean;
    fee?: number;
    organizerId?: string;
}

const createEvent = async (data: EventInput) => {
    return await prisma.event.create({
        data,
        include: {
            organizer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    isDeleted: true
                }
            },
            registrations: true,
            reviews: true,
        },
    });
};

const getAllEvents = async () => {
    return await prisma.event.findMany({
        where: { isDeleted: false },
        include: {
            organizer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    isDeleted: true
                }
            },
            registrations: true,
            reviews: true,
        },
        orderBy: { date: "asc" },
    });
};

const getMyEvents = async (organizerId: string) => {
    return await prisma.event.findMany({
        where: {
            organizerId,
            isDeleted: false,
        },
        include: {
            registrations: true,
        },
        orderBy: { date: "desc" },
    });
};

const getEventParticipants = async (eventId: string) => {
    // check if event exists & not deleted
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event || event.isDeleted) {
        throw new Error("Event not found");
    }

    // get participants
    const participants = await prisma.registration.findMany({
        where: {
            eventId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return participants;
};

const getEventById = async (id: string) => {
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            organizer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    isDeleted: true
                }
            },
            registrations: true,
            reviews: true,
        },
    });
    if (!event || event.isDeleted) {
        return null;
    }
    return event;
};

const updateEvent = async (id: string, data: Partial<EventInput>, userId: string) => {
    const event = await getEventById(id);

    if (!event) {
        throw new Error("Event not found");
    }
    if (event.organizerId !== userId) {
        throw new Error("Unauthorized");
    }
    return await prisma.event.update({
        where: { id },
        data,
        include: {
            organizer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    isDeleted: true
                }
            },
            registrations: true,
            reviews: true,
        },
    });
};

const getFeaturedEvent = async () => {
    const events = await prisma.event.findMany({
        where: { isFeatured: true },
    });

    console.log("FEATURED EVENTS:", events);

    return events;
};

const deleteEvent = async (id: string, userId: string) => {
    const event = await getEventById(id);

    if (!event) {
        throw new Error("Event not found");
    }
    if (event.organizerId !== userId) {
        throw new Error("Unauthorized");
    }
    return await prisma.event.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date()
        },
    });
};

export const eventService = {
    createEvent,
    getAllEvents,
    getEventById,
    getEventParticipants,
    updateEvent,
    getFeaturedEvent,
    deleteEvent,
    getMyEvents
};