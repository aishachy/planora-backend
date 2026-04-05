import { Router } from "express";
import { reviewController } from "./review.controller.js";

const router = Router();

router.post("/", reviewController.createReview);
router.get("/", reviewController.getAllReviews);
router.get("/event/:eventId", reviewController.getReviewsByEvent);
router.patch("/:id", reviewController.updateReview);
router.delete("/:id", reviewController.deleteReview);

export const reviewRouter = router;
