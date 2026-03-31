/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { adminService } from "./admin.service";

// USERS
const getAllUsers = async (_req: Request, res: Response) => {
    try {
        const result = await adminService.getAllUsers();
        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to retrieve users",
        });
    }
};

const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const result = await adminService.deleteUser(id);
        res.status(201).json({
            success: true,
            message: "User deleted successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "User deletion failed",
        });
    }
};

// EVENTS
const getAllEvents = async (_req: Request, res: Response) => {
    try {
        const result = await adminService.getAllEvents();
        res.status(200).json({
            success: true,
            message: "Events retrieved successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to retrieve events",
        });
    }
}

const deleteEvent = async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    try {
        const result = await adminService.deleteEvent(id);
        res.status(200).json({
            success: true,
            message: "Event deleted successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to delete event",
        });

    }
}

// REGISTRATIONS
const getAllRegistrations = async (_req: Request, res: Response) => {
    try {
        const result = await adminService.getAllRegistrations();
        res.status(200).json({
            success: true,
            message: "Registrations retrieved successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to retrieve registrations",
        });
    }
};

const approveRegistration = async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    try {
        const result = await adminService.approveRegistration(id);
        res.status(200).json({
            success: true,
            message: "Registration approved successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to approve registration",
        });
    }
};

const rejectRegistration = async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    try {
        const result = await adminService.deleteEvent(id);
        res.status(200).json({
            success: true,
            message: "Registration rejected successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to reject registration",
        });

    }
};

// REVIEWS
const deleteReview = async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    try {
        const result = await adminService.deleteReview(id);
        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to delete review",
        });
    }
};

// DASHBOARD
const getDashboardStats = async (_req: Request, res: Response) => {
    try {
        const result = await adminService.getDashboardStats();
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to retrieve dashboard stats",
        });
    }
};

export const adminController = {
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