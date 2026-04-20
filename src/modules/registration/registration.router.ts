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
} from "./registration.controller.js";
import auth from "../../middleware/auth.js";

const router = Router();

// Register for an event
router.post("/", auth(), registerToEvent);

// Get all registrations (admin)
router.get("/", auth(), getAllRegistrations);

// Get a user's registrations
router.get("/me", auth(), getMyRegistrations);
router.get("/event/:eventId", auth(), getEventRegistrations);


// Approve / Reject registrations
router.patch("/approve/:id", auth(), approveRegistration);
router.patch("/reject/:id", auth(), rejectRegistration);

// Delete a registration
router.delete("/:id", auth(), deleteRegistration);

router.post("/ban", auth(), banParticipant);

export const registrationRouter = router;