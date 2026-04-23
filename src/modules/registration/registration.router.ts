import { Router } from "express";
import {
  registerToEvent,
  getAllRegistrations,
  getMyRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
  banParticipant,
  getEventRegistrations,
  unbanParticipant,
} from "./registration.controller.js";
import auth from "../../middleware/auth.js";

const router = Router();

// Register for an event
router.post("/", auth("USER"), registerToEvent);

// Get all registrations (optional admin)
router.get("/", auth("USER"), getAllRegistrations);

// Get my registrations
router.get("/me", auth("USER"), getMyRegistrations);

// Get event registrations (OWNER ONLY)
router.get("/event/:eventId", auth("USER"), getEventRegistrations);

// Approve / Reject (OWNER ONLY)
router.patch("/approve/:id", auth("USER"), approveRegistration);
router.patch("/reject/:id", auth("USER"), rejectRegistration);

// Ban / Unban
router.post("/ban", auth("USER"), banParticipant);
router.post("/unban", auth("USER"), unbanParticipant);

// Delete registration
router.delete("/:id", auth("USER"), deleteRegistration);

export const registrationRouter = router;