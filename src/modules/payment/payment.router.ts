import { Router } from "express";
import express from "express";
import { PaymentController } from "./payment.controller";

const router = Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleStripeWebhookEvent
);

export const paymentRouter = router;