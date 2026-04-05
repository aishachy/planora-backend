import { Router } from "express";
import {
  registerToEvent,
  getAllRegistrations,
  getMyRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
} from "./registration.controller.js";

const router = Router();

// Register for an event
router.post("/", registerToEvent);

// Get all registrations (admin)
router.get("/", getAllRegistrations);

// Get a user's registrations
router.get("/user/:userId", getMyRegistrations);

// Approve / Reject registrations
router.patch("/approve/:id", approveRegistration);
router.patch("/reject/:id", rejectRegistration);

// Delete a registration
router.delete("/:id", deleteRegistration);

export const registrationRouter = router;