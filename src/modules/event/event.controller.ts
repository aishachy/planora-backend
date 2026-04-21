/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { eventService } from "./event.service.js";


const createEvent = async (req: Request, res: Response) => {
    try {
        const data = { ...req.body, organizerId: req.user!.id };
        const result = await eventService.createEvent(data);
        res.status(201).json({
            success: true,
            message: "Event created successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Event creation failed",
        });
    }
};

const getAllEvents = async (_req: Request, res: Response) => {
    try {
        const result = await eventService.getAllEvents();
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Events retrieval failed",
        });
    }
}

const getMyEvents = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        const result = await eventService.getMyEvents(userId);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getEventById = async (req: Request, res: Response) => {
    try {
        const eventId = String(req.params.id);
        const result = await eventService.getEventById(eventId);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Events retrieval failed",
        });
    }
};

const getEventParticipants = async (req: Request, res: Response) => {
    try {
        const eventId = String(req.params.id);

        const result = await eventService.getEventParticipants(eventId);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to get participants",
        });
    }
};

const updateEvent = async (req: Request, res: Response) => {
    try {
        const eventId = String(req.params.id);
        const result = await eventService.updateEvent(eventId, req.body, req.user!.id);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Events retrieval failed",
        });
    }
};

const getFeaturedEvent = async (req: Request, res: Response) => {
    console.log("🔥 FEATURED EVENT API HIT");
    try {
        const events = await eventService.getFeaturedEvent();

        if (!events || events.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No featured events found",
                data: [],
            });
        }

        return res.status(200).json({
            success: true,
            data: events,
        });
    } catch (err: any) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const deleteEvent = async (req: Request, res: Response) => {
    try {
        const eventId = String(req.params.id);
        const result = await eventService.deleteEvent(eventId, req.user!.id);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Events deletion failed",
        });
    }
};

export const eventController = {
    createEvent,
    getAllEvents,
    getEventById,
    getEventParticipants,
    updateEvent,
    getFeaturedEvent,
    deleteEvent,
    getMyEvents
};