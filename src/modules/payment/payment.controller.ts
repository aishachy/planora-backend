/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import Stripe from "stripe";

import { PaymentService } from "./payment.service.js";
import { envVars } from "../../app/config/env.js";
import { catchAsync } from "../../app/shared/catchAsync.js";
import { sendResponse } from "../../app/shared/sendResponse.js";
import { stripe } from "../../app/config/stripe.config.js";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../lib/prisma.js";

// ====================================
// CREATE CHECKOUT SESSION
// ====================================
const createCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const { registrationId, amount } = req.body;

    if (!registrationId || !amount) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Missing registrationId or amount",
      });
    }

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

    if (existingPayment) {
      payment = existingPayment;
    } else {
      payment = await PaymentService.createPaymentRecord({
        registrationId,
        amount,
        transactionId: uuidv4(),
      });
    }

    const session =
      await PaymentService.createStripeCheckoutSession(
        payment,
        registrationId,
        amount
      );

    return res.status(status.OK).json({
      success: true,
      message: existingPayment
        ? "Reusing existing pending payment"
        : "Checkout session created",
      payment,
      sessionId: session.id,
      url: session.url,
    });
  }
);

// ====================================
// STRIPE WEBHOOK
// ====================================
const handleStripeWebhookEvent = catchAsync(
  async (req: Request, res: Response) => {
    console.log("🔥 WEBHOOK HIT");

    const signature = req.headers[
      "stripe-signature"
    ] as string;

    const webhookSecret =
      envVars.STRIPE.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message:
          "Missing stripe signature or webhook secret",
      });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        signature,
        webhookSecret
      );

      console.log(
        "✅ Stripe Event:",
        event.type
      );
    } catch (error: any) {
      console.error(
        "❌ Webhook Signature Error:",
        error.message
      );

      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    try {
      await PaymentService.handlerStripeWebhookEvent(
        event
      );

      return sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message:
          "Stripe webhook processed successfully",
        data: null,
      });
    } catch (error: any) {
      console.error(
        "❌ Webhook Processing Error:",
        error
      );

      return sendResponse(res, {
        httpStatusCode:
          status.INTERNAL_SERVER_ERROR,
        success: false,
        message: "Error handling webhook",
      });
    }
  }
);

export const PaymentController = {
  createCheckoutSession,
  handleStripeWebhookEvent,
};