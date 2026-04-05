/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import { PaymentService } from "./payment.service.js";
import { envVars } from "../../app/config/env.js";
import { catchAsync } from "../../app/shared/catchAsync.js";
import { sendResponse } from "../../app/shared/sendResponse.js";
import { stripe } from "../../app/config/stripe.config.js";
import { v4 as uuidv4 } from "uuid";

// Create Stripe checkout session
const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const { registrationId, amount } = req.body;

  if (!registrationId || !amount)
    return res.status(400).json({ success: false, message: "Missing registrationId or amount" });

  const payment = await PaymentService.createPaymentRecord({
    registrationId,
    amount,
    transactionId: uuidv4(),
  });

  const session = await PaymentService.createStripeCheckoutSession(payment, registrationId, amount);

  res.status(200).json({
    success: true,
    message: "Checkout session created",
    payment,
    sessionId: session.id,
    url: session.url,
  });
});

// Handle Stripe webhook
const handleStripeWebhookEvent = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) return res.status(status.BAD_REQUEST).json({ message: "Missing signature or webhook secret" });

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return res.status(status.BAD_REQUEST).json({ message: "Error processing webhook" });
  }

  try {
    const result = await PaymentService.handlerStripeWebhookEvent(event);
    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Stripe webhook event processed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    sendResponse(res, {
      httpStatusCode: status.INTERNAL_SERVER_ERROR,
      success: false,
      message: "Error handling webhook",
    });
  }
});

export const PaymentController = {
  createCheckoutSession,
  handleStripeWebhookEvent,
};