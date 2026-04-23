/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { registrationService } from "./registration.service.js";

/* =====================================================
   REGISTER TO EVENT
===================================================== */
export const registerToEvent = async (req: Request, res: Response) => {
  try {
    const { eventId, status } = req.body;
    const userId = (req as any).user?.id;

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

/* =====================================================
   GET ALL REGISTRATIONS
===================================================== */
export const getAllRegistrations = async (_req: Request, res: Response) => {
  try {
    const registrations = await registrationService.getAllRegistrations();

    res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   GET MY REGISTRATIONS
===================================================== */
export const getMyRegistrations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const registrations =
      await registrationService.getMyRegistrations(userId);

    res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   GET EVENT REGISTRATIONS (OWNER)
   + optional ?status=PENDING
===================================================== */
export const getEventRegistrations = async (req: Request, res: Response) => {
  try {
    const eventId = Array.isArray(req.params.eventId)
      ? req.params.eventId[0]
      : req.params.eventId;
    const ownerId = (req as any).user?.id;
    const status = req.query.status as any;

    const registrations =
      await registrationService.getEventRegistrations(
        eventId,
        ownerId,
        status
      );

    res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   APPROVE
===================================================== */
export const approveRegistration = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const ownerId = (req as any).user?.id;

    const updated = await registrationService.approveRegistration(
      id,
      ownerId
    );

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   REJECT
===================================================== */
export const rejectRegistration = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
  ? req.params.id[0]
  : req.params.id;
    const ownerId = (req as any).user?.id;

    const updated = await registrationService.rejectRegistration(
      id,
      ownerId
    );

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   BAN
===================================================== */
export const banParticipant = async (req: Request, res: Response) => {
  try {
    const { userId, eventId } = req.body;
    const ownerId = (req as any).user?.id;

    if (!userId || !eventId) {
      return res.status(400).json({
        success: false,
        message: "Missing userId or eventId",
      });
    }

    const result = await registrationService.banParticipant(
      userId,
      eventId,
      ownerId
    );

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

/* =====================================================
   UNBAN (NEW)
===================================================== */
export const unbanParticipant = async (req: Request, res: Response) => {
  try {
    const { userId, eventId } = req.body;
    const ownerId = (req as any).user?.id;

    const result = await registrationService.unbanParticipant(
      userId,
      eventId,
      ownerId
    );

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

/* =====================================================
   DELETE
===================================================== */
export const deleteRegistration = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const deleted = await registrationService.deleteRegistration(id);

    res.status(200).json({
      success: true,
      data: deleted,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};