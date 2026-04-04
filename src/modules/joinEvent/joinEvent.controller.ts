/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { joinEventService } from "./joinEvent.service";

const joinEvent = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { eventId } = req.body;

    const result = await joinEventService.joinEvent({
      userId,
      eventId,
    });

    res.status(201).json({
      success: true,
      message: "Joined event successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Join failed",
    });
  }
};

const getAllRegistrations = async (_req: Request, res: Response) => {
  try {
    const result = await joinEventService.getAllRegistrations();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Registrations retrieval failed",
    });
  }
};

const getMyRegistrations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await joinEventService.getMyRegistrations(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Registrations retrieval failed",
    });
  }
};

const deleteRegistration = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const result = await joinEventService.deleteRegistration(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Registration deletion failed",
    });
  }
};

export const joinEventController = {
  joinEvent,
  getAllRegistrations,
  getMyRegistrations,
  deleteRegistration,
};