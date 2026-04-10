/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { userService } from "./user.service.js";

/* =========================
   CREATE USER
========================= */
const createUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "User creation failed",
    });
  }
};

/* =========================
   GET ALL USERS
========================= */
const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const result = await userService.getAllUsers();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Users retrieval failed",
    });
  }
};

/* =========================
   GET USER BY ID
========================= */
const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.id);
    const result = await userService.getUserById(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message || "User not found",
    });
  }
};

/* =========================
   UPDATE USER
========================= */
const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.id);
    const result = await userService.updateUser(userId, req.body);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "User update failed",
    });
  }
};

/* =========================
   DELETE USER (SOFT DELETE)
========================= */
const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.id);
    const result = await userService.deleteUser(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "User deletion failed",
    });
  }
};

/* =========================
   BAN USER
========================= */
const banUser = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.id);
    const result = await userService.banUser(userId);

    res.status(200).json({
      success: true,
      message: "User banned successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Ban failed",
    });
  }
};

/* =========================
   UNBAN USER
========================= */
const unbanUser = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.id);
    const result = await userService.unbanUser(userId);

    res.status(200).json({
      success: true,
      message: "User unbanned successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Unban failed",
    });
  }
};

/* =========================
   EXPORT
========================= */
export const userController = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  banUser,
  unbanUser,
};