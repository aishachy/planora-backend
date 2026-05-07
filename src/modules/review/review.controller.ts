/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { ReviewService } from "./review.service.js";

/**
 * CREATE REVIEW
 */
const createReview = async (req: Request, res: Response) => {
    try {
        const user = req.user;

        if (!user?.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const data = {
            ...req.body,
            userId: user.id,
        };

        const result = await ReviewService.createReview(data);

        return res.status(201).json({
            success: true,
            message: "Review created successfully",
            data: result,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Review creation failed",
        });
    }
};

/**
 * GET ALL REVIEWS
 */
const getAllReviews = async (_req: Request, res: Response) => {
    try {
        const result = await ReviewService.getAllReviews();

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch reviews",
        });
    }
};

/**
 * GET REVIEWS BY EVENT
 */
const getReviewsByEvent = async (req: Request, res: Response) => {
    try {
        const eventIdParam = req.params.eventId;
        const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "Event ID is required",
            });
        }

        const result = await ReviewService.getReviewsByEvent(eventId);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch reviews",
        });
    }
};

/**
 * UPDATE REVIEW
 */
const updateReview = async (req: Request, res: Response) => {
    try {
        const user = req.user;

        if (!user?.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const reviewId = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;

        const result = await ReviewService.updateReview(
            reviewId,
            user.id,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: result,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Review update failed",
        });
    }
};

/**
 * DELETE REVIEW
 */
const deleteReview = async (req: Request, res: Response) => {
    try {
        const user = req.user;

        if (!user?.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const reviewId = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;

        const result = await ReviewService.deleteReview(
            reviewId,
            user.id
        );

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully",
            data: result,
        });
    } catch (error: any) {
        return res.status(400).json({
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