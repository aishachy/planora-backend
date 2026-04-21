import { Router } from "express";
import { eventController } from "./event.controller.js";
import auth from "../../middleware/auth.js";

const router = Router();

router.post("/", auth("ADMIN", "USER"), eventController.createEvent);
router.get("/", eventController.getAllEvents);
router.get("/myEvent", auth("ADMIN", "USER"), eventController.getMyEvents);
router.get("/:id/participants", auth("ADMIN", "USER"), eventController.getEventParticipants);
router.get("/featured", eventController.getFeaturedEvent);
router.get("/:id", eventController.getEventById);
router.put("/:id", auth("ADMIN", "USER"), eventController.updateEvent);
router.delete("/:id", auth("ADMIN", "USER"), eventController.deleteEvent);

export const eventRouter = router;