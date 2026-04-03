import { Router } from "express";
import { eventController } from "./event.controller";
import auth from "../../middleware/auth";

const router = Router();

router.post("/", auth(), eventController.createEvent);
router.get("/", eventController.getAllEvents);
router.get("/:id", eventController.getEventById);
router.put("/:id", eventController.updateEvent);
router.delete("/:id", auth("ADMIN", "USER"), eventController.deleteEvent);

export const eventRouter = router;