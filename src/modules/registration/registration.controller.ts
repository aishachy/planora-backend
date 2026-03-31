/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { registrationService } from "./registration.service";

// Register to event
const registerToEvent = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { eventId } = req.body;

        const result = await registrationService.registerToEvent(userId, eventId);

        res.status(201).json({
            success: true,
            message: "Registered to event successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Event registration failed",
        });
    }
};

//  Get all registrations (ADMIN)
const getAllRegistrations = async (_req: Request, res: Response) => {
    try {
        const result = await registrationService.getAllRegistrations();

        res.status(200).json({
            success: true,
            message: "Registrations retrieved successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Registrations retrieval failed",
        });
    }
};

//  Get my registrations
const getMyRegistrations = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        const result = await registrationService.getMyRegistrations(userId);

        res.status(200).json({
            success: true,
            message: "My registrations retrieved successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Registrations retrieval failed",
        });
    }
};

// Approve registration
const approveRegistration = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        const result = await registrationService.approveRegistration(id);

        res.status(200).json({
            success: true,
            message: "Registration approved successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Registration approval failed",
        });
    }
};

//  Reject registration
const rejectRegistration = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        const result = await registrationService.rejectRegistration(id);

        res.status(200).json({
            success: true,
            message: "Registration rejected successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Registration rejection failed",
        });
    }
};

//  Delete registration
const deleteRegistration = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        const result = await registrationService.deleteRegistration(id);

        res.status(200).json({
            success: true,
            message: "Registration deleted successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Registration deletion failed",
        });
    }
};

export const registrationController = {
    registerToEvent,
    getAllRegistrations,
    getMyRegistrations,
    approveRegistration,
    rejectRegistration,
    deleteRegistration,
};