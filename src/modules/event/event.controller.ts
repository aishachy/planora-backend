/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { eventService } from "./event.service.js";
import { prisma } from "../../lib/prisma.js";

/* =========================
   CREATE EVENT
========================= */
const createEvent = async (req: Request, res: Response) => {
  try {
    const data = {
      ...req.body,
      organizerId: req.user!.id,
    };

    const result = await eventService.createEvent(data);

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Event creation failed",
    });
  }
};

/* =========================
   GET ALL EVENTS
========================= */
const getAllEvents = async (_req: Request, res: Response) => {
  try {
    const result = await eventService.getAllEvents();

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Events retrieval failed",
    });
  }
};

/* =========================
   GET MY EVENTS
========================= */
const getMyEvents = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await eventService.getMyEvents(userId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   GET EVENT BY ID
========================= */
const getEventById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    const result = await eventService.getEventById(id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Event retrieval failed",
    });
  }
};

/* =========================
   GET PARTICIPANTS
========================= */
const getEventParticipants = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    const result = await eventService.getEventParticipants(id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to get participants",
    });
  }
};

/* =========================
   UPDATE EVENT
========================= */
const updateEvent = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.id;

    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required data",
      });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        organizerId: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this event",
      });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: req.body,
      include: {
        organizer: true,
        registrations: true,
        reviews: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/* =========================
   FEATURED EVENTS
========================= */
const getFeaturedEvent = async (_req: Request, res: Response) => {
  try {
    const events = await eventService.getFeaturedEvent();

    return res.status(200).json({
      success: true,
      data: events || [],
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   DELETE EVENT
========================= */
const deleteEvent = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    const result = await eventService.deleteEvent(id, req.user!.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Event deletion failed",
    });
  }
};

/* =========================
   PARTICIPATION STATUS
========================= */
const getParticipationStatus = async (req: Request, res: Response) => {
  try {
    const eventId = String(req.params.id);
    const userId = req.user!.id;

    const status = await eventService.getParticipationStatus(
      eventId,
      userId
    );

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   EXPORT
========================= */
export const eventController = {
  createEvent,
  getAllEvents,
  getEventById,
  getEventParticipants,
  updateEvent,
  getFeaturedEvent,
  deleteEvent,
  getMyEvents,
  getParticipationStatus,
};