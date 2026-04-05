/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { ReviewService } from "./review.service.js";

const createReview = async (req: Request, res: Response) => {
    try {
        const data = {
            ...req.body,
            userId: req.user!.id, // ✅ from auth
        };

        const result = await ReviewService.createReview(data);

        res.status(201).json({
            success: true,
            message: "Review created successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Review creation failed",
        });
    }
};

const getAllReviews = async (_req: Request, res: Response) => {
    try {
        const result = await ReviewService.getAllReviews();

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Reviews retrieval failed",
        });
    }
};

const getReviewsByEvent = async (req: Request, res: Response) => {
    try {
        const eventId = String(req.params.eventId);

        const result = await ReviewService.getReviewsByEvent(eventId);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Reviews retrieval failed",
        });
    }
};

const updateReview = async (req: Request, res: Response) => {
    try {
        const reviewId = String(req.params.id);

        const result = await ReviewService.updateReview(
            reviewId,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Review update failed",
        });
    }
};

const deleteReview = async (req: Request, res: Response) => {
    try {
        const reviewId = String(req.params.id);

        const result = await ReviewService.deleteReview(reviewId);

        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Review deletion failed",
        });
    }
};

export const reviewController = {
    createReview,
    getAllReviews,
    getReviewsByEvent,
    updateReview,
    deleteReview,
};