/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { registrationService } from "./registration.service.js";


// Register to an event

export const registerToEvent = async (req: Request, res: Response) => {
  try {
    const { eventId, status } = req.body;

    // 🔥 IMPORTANT: get user from auth middleware later
    const userId = (req as any).user?.id || req.body.userId;

    if (!userId || !eventId) {
      return res.status(400).json({
        success: false,
        message: "Missing userId or eventId",
      });
    }

    const registration = await registrationService.registerToEvent(
      userId,
      eventId,
      status
    );

    res.status(201).json({
      success: true,
      data: registration,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all registrations
export const getAllRegistrations = async (_req: Request, res: Response) => {
  try {
    const registrations = await registrationService.getAllRegistrations();
    res.status(200).json({ success: true, data: registrations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get registrations for a user
export const getMyRegistrations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const id = Array.isArray(userId) ? userId[0] : userId;
    const registrations = await registrationService.getMyRegistrations(id);
    res.status(200).json({ success: true, data: registrations });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Approve registration
export const approveRegistration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const registrationId = Array.isArray(id) ? id[0] : id;
    const updated = await registrationService.approveRegistration(registrationId);
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Reject registration
export const rejectRegistration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const registrationId = Array.isArray(id) ? id[0] : id;
    const updated = await registrationService.rejectRegistration(registrationId);
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete registration
export const deleteRegistration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const registrationId = Array.isArray(id) ? id[0] : id;
    const deleted = await registrationService.deleteRegistration(registrationId);
    res.status(200).json({ success: true, data: deleted });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};