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

const getParticipationType = (event: {
    isPublic: boolean;
    isPaid: boolean;
}) => {
    if (event.isPublic && !event.isPaid) {
        return "FREE_PUBLIC";
    }

    if (event.isPublic && event.isPaid) {
        return "PAID_PUBLIC";
    }

    if (!event.isPublic && !event.isPaid) {
        return "PRIVATE_FREE";
    }

    return "PRIVATE_PAID";
};

const getAllEvents = async () => {
    const events = await prisma.event.findMany({
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
                    isDeleted: true,
                },
            },
            registrations: true,
            reviews: true,
        },
        orderBy: {
            date: "asc",
        },
    });

    return events.map((event) => ({
        ...event,
        participationType: getParticipationType(event),
    }));
};

const getMyEvents = async (organizerId: string) => {
    const events = await prisma.event.findMany({
        where: {
            organizerId,
            isDeleted: false,
        },
        include: {
            registrations: true,
        },
        orderBy: { date: "desc" },
    });

    return events.map((event) => ({
        ...event,
        participationType: getParticipationType(event),
    }));
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
    return {
        ...event,
        participationType: getParticipationType(event),
    }
};

const updateEvent = async (
    id: string,
    data: Partial<EventInput>,
    userId: string
) => {
    const event = await getEventById(id);

    if (!event) {
        throw new Error("Event not found");
    }

    if (event.organizerId !== userId) {
        throw new Error("Unauthorized");
    }

    // ✅ CLEAN DATA (VERY IMPORTANT)
    const {
        title,
        description,
        date,
        time,
        venue,
        isPublic,
        isPaid,
        fee,
    } = data;

    return await prisma.event.update({
        where: { id },
        data: {
            title,
            description,
            date,
            time,
            venue,
            isPublic,
            isPaid,
            fee,
        },
        include: {
            organizer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    isDeleted: true,
                },
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

const getParticipationStatus = async (eventId: string, userId: string) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) throw new Error("Event not found");

    const registration = await prisma.registration.findFirst({
        where: {
            eventId,
            userId,
        },
    });

    // FREE PUBLIC → join instantly
    if (event.isPublic && !event.isPaid) {
        return registration ? "JOINED" : "CAN_JOIN";
    }

    // PAID PUBLIC → payment required
    if (event.isPublic && event.isPaid) {
        return registration ? "REGISTERED" : "PAYMENT_REQUIRED";
    }

    // PRIVATE FREE → request join
    if (!event.isPublic && !event.isPaid) {
        return registration ? "JOINED" : "REQUEST_REQUIRED";
    }

    // PRIVATE PAID → payment + approval
    if (!event.isPublic && event.isPaid) {
        return registration ? "PENDING_APPROVAL" : "PAYMENT_REQUIRED";
    }

    return "UNKNOWN";
};


export const eventService = {
    createEvent,
    getAllEvents,
    getEventById,
    getEventParticipants,
    updateEvent,
    getFeaturedEvent,
    deleteEvent,
    getMyEvents,
    getParticipationStatus,
    getParticipationType
};