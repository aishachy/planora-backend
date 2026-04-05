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
    if (!event || event.isDeleted)
        throw new Error("Event not found");
    return event;
};

const updateEvent = async (id: string, data: Partial<EventInput>) => {
    await getEventById(id);
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

const deleteEvent = async (id: string) => {
    await getEventById(id);
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
    updateEvent,
    deleteEvent,
};