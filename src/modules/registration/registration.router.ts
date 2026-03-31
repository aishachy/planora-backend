import { Router } from "express";
import { registrationController } from "./registration.controller";


const router = Router();

router.post("/", registrationController.registerToEvent);
router.get("/me", registrationController.getMyRegistrations);
router.get("/", registrationController.getAllRegistrations);
router.patch("/approve/:id", registrationController.approveRegistration);
router.patch("/reject/:id", registrationController.rejectRegistration);
router.delete("/:id", registrationController.deleteRegistration);

export const registrationRouter = router;