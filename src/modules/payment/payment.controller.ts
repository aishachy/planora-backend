/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import { PaymentService } from "./payment.service.js";
import { envVars } from "../../app/config/env.js";
import { catchAsync } from "../../app/shared/catchAsync.js";
import { sendResponse } from "../../app/shared/sendResponse.js";
import { stripe } from "../../app/config/stripe.config.js";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../lib/prisma.js";

// CREATE CHECKOUT SESSION
const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const { registrationId, amount } = req.body;

  if (!registrationId || !amount) {
    return res.status(400).json({
      success: false,
      message: "Missing registrationId or amount",
    });
  }

  // STEP 1: Check for existing PENDING payment
  const existingPayment = await prisma.payment.findFirst({
    where: {
      registrationId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let payment;

  // STEP 2: If pending exists → reuse it instead of blocking
  if (existingPayment) {
    payment = existingPayment;
  } else {
    // STEP 3: Create new payment record
    payment = await PaymentService.createPaymentRecord({
      registrationId,
      amount,
      transactionId: uuidv4(),
    });
  }

  // STEP 4: Always create a fresh Stripe session
  const session = await PaymentService.createStripeCheckoutSession(
    payment,
    registrationId,
    amount
  );

  return res.status(200).json({
    success: true,
    message: existingPayment
      ? "Reusing existing pending payment"
      : "Checkout session created",
    payment,
    sessionId: session.id,
    url: session.url,
  });
});

// STRIPE WEBHOOK
const handleStripeWebhookEvent = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;
  console.log("WEBHOOK HIT");
  if (!signature || !webhookSecret) {
    return res.status(status.BAD_REQUEST).json({
      success: false,
      message: "Missing signature or webhook secret",
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (error: any) {
    console.error("Webhook signature error:", error.message);
    return res.status(status.BAD_REQUEST).json({
      success: false,
      message: "Invalid webhook signature",
    });
  }

  try {
    const result = await PaymentService.handlerStripeWebhookEvent(event);

    return sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Stripe webhook processed successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Webhook handler error:", error.message);

    return sendResponse(res, {
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