import { Router } from "express";
import { eventController } from "./event.controller.js";
import auth from "../../middleware/auth.js";

const router = Router();

router.post("/", auth(), eventController.createEvent);
router.get("/", eventController.getAllEvents);
router.get("/featured", eventController.getFeaturedEvent);
router.get("/:id", eventController.getEventById);
router.put("/:id", eventController.updateEvent);
router.delete("/:id", auth("ADMIN", "USER"), eventController.deleteEvent);

export const eventRouter = router;