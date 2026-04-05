import { Router } from "express";
import express from "express";
import { PaymentController } from "./payment.controller.js";

const router = Router();

// Create a checkout session
router.post("/create-checkout-session", express.json(), PaymentController.createCheckoutSession);

// Stripe webhook endpoint (raw body required)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleStripeWebhookEvent
);

export const paymentRouter = router;