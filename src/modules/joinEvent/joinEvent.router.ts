import { Router } from "express";

import { joinEventController } from "./joinEvent.controller.js";
import auth from "../../middleware/auth.js";

const router = Router();

// Join Event
router.post("/join", auth(), joinEventController.joinEvent);

// Get All Registrations (Admin only if you want)
router.get("/all", auth(), joinEventController.getAllRegistrations);

// Get My Registrations
router.get("/my", auth(), joinEventController.getMyRegistrations);

// Delete Registration
router.delete("/:id", auth(), joinEventController.deleteRegistration);

export const joinEventRoutes = router;