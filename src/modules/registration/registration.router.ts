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
  getRegistrationById,
} from "./registration.controller.js";
import auth from "../../middleware/auth.js";

const router = Router();

/* =========================
   CREATE
========================= */
router.post("/", auth("USER"), registerToEvent);

/* =========================
   SPECIAL ROUTES (MUST COME FIRST)
========================= */

// My registrations
router.get("/me", auth("USER", "ADMIN"), getMyRegistrations);

// Event registrations
router.get("/event/:eventId", auth("USER"), getEventRegistrations);

// Ban / Unban
router.post("/ban", auth("USER"), banParticipant);
router.post("/unban", auth("USER"), unbanParticipant);


// Get all
router.get("/", auth("USER", "ADMIN"), getAllRegistrations);

// Get by ID (MUST be after /me, /event etc.)
router.get("/:id", auth("USER", "ADMIN"), getRegistrationById);

// Update actions
router.patch("/approve/:id", auth("USER"), approveRegistration);
router.patch("/reject/:id", auth("USER"), rejectRegistration);

// Delete
router.delete("/:id", auth("USER"), deleteRegistration);

export const registrationRouter = router;