import express from "express";
import { adminController } from "./admin.controller.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// USERS
router.get("/users", auth("ADMIN"), adminController.getAllUsers);
router.delete("/users/:id", auth("ADMIN"), adminController.deleteUser);

// EVENTS
router.get("/events", auth("ADMIN"), adminController.getAllEvents);
router.delete("/events/:id", auth("ADMIN"), adminController.deleteEvent);

// REGISTRATIONS
router.get("/registrations", auth("ADMIN"), adminController.getAllRegistrations);
router.patch("/registrations/:id/approve", auth("ADMIN"), adminController.approveRegistration);
router.patch("/registrations/:id/reject", auth("ADMIN"), adminController.rejectRegistration);

// REVIEWS
router.delete("/reviews/:id", auth("ADMIN"), adminController.deleteReview);

// DASHBOARD
router.get("/stats", auth("ADMIN"), adminController.getDashboardStats);

export const adminRouter = router;