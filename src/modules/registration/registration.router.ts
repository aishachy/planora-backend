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
router.post("/", auth("ADMIN"), registerToEvent);

// Get all registrations (admin)
router.get("/", auth("ADMIN"), getAllRegistrations);

// Get a user's registrations
router.get("/me", auth("USER"), getMyRegistrations);
router.get("/event/:eventId", auth("USER"), getEventRegistrations);


// Approve / Reject registrations
router.patch("/approve/:id", auth("ADMIN"), approveRegistration);
router.patch("/reject/:id", auth("ADMIN"), rejectRegistration);

// Delete a registration
router.delete("/:id", auth("ADMIN"), deleteRegistration);

router.post("/ban", auth("ADMIN"), banParticipant);

export const registrationRouter = router;