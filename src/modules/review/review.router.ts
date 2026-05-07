import { Router } from "express";
import { reviewController } from "./review.controller.js";
import auth from "../../middleware/auth.js";

const router = Router();

router.post("/", auth("ADMIN", "USER"), reviewController.createReview);
router.get("/", reviewController.getAllReviews);
router.get("/event/:eventId", reviewController.getReviewsByEvent);
router.patch("/:id", auth("ADMIN", "USER"), reviewController.updateReview);
router.delete("/:id", auth("ADMIN", "USER"), reviewController.deleteReview);

export const reviewRouter = router;
