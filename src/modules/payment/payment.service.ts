/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "../../lib/prisma.js";
import {
  PaymentStatus,
  RegistrationStatus,
} from "../../generated/prisma/enums.js";
import { uploadFileToCloudinary } from "../../app/config/cloudinary.config.js";
import { sendEmail } from "../../utils/email.js";
import { generateInvoicePdf } from "../../utils/payment.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export const PaymentService = {
  createPaymentRecord: async (data: {
    registrationId: string;
    amount: number;
    transactionId: string;
  }) => {
    return prisma.payment.create({
      data: {
        registrationId: data.registrationId,
        amount: data.amount,
        status: PaymentStatus.PENDING,
        transactionId: data.transactionId,
      },
    });
  },

  createStripeCheckoutSession: async (
    payment: any,
    registrationId: string,
    amount: number
  ) => {
    return stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Event Ticket",
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],

      metadata: {
        registrationId,
        paymentId: payment.id,
      },

      success_url: `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    });
  },

  handlerStripeWebhookEvent: async (event: Stripe.Event) => {
    console.log("🔥 WEBHOOK RECEIVED:", event.type);

    try {
      const existing = await prisma.payment.findFirst({
        where: { stripeEventId: event.id },
      });

      if (existing) {
        console.log("Duplicate webhook ignored");
        return;
      }

      if (event.type !== "checkout.session.completed") {
        return;
      }

      const session = event.data.object as Stripe.Checkout.Session;

      const registrationId = session.metadata?.registrationId;
      const paymentId = session.metadata?.paymentId;

      if (!registrationId || !paymentId) {
        console.log("Missing metadata");
        return;
      }

      const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: {
          user: true,
          event: true,
        },
      });

      if (!registration) {
        console.log("Registration not found");
        return;
      }

      const isPaid =
        session.payment_status === "paid" ||
        session.status === "complete";

      // =========================
      // STEP 1: UPDATE PAYMENT
      // =========================
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: isPaid
            ? PaymentStatus.COMPLETED
            : PaymentStatus.FAILED,
          stripeEventId: event.id,
          paymentGatewayData: session as any,
        },
      });

      if (!isPaid) return;

      // =========================
      // STEP 2: UPDATE REGISTRATION
      // =========================
      await prisma.registration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.ACCEPTED,
        },
      });

      // =========================
      // STEP 4: HEAVY TASKS
      // =========================
      try {
        const pdfBuffer = await generateInvoicePdf({
          invoiceId: updatedPayment.id,
          registrationName: registration.user.name,
          registrationEmail: registration.user.email,
          eventTitle: registration.event.title,
          amount: updatedPayment.amount,
          transactionId: updatedPayment.transactionId,
          paymentDate: new Date().toISOString(),
        });

        const cloudinaryResponse = await uploadFileToCloudinary(
          pdfBuffer,
          `invoices/invoice-${paymentId}.pdf`
        );

        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            invoiceUrl: cloudinaryResponse?.secure_url,
          },
        });

        await sendEmail({
          to: registration.user.email,
          subject: `Payment Confirmation - ${registration.event.title}`,
          templateName: "invoice",
          templateData: {
            registrationName: registration.user.name,
            invoiceId: updatedPayment.id,
            transactionId: updatedPayment.transactionId,
            paymentDate: new Date().toLocaleDateString(),
            eventName: registration.event.title,
            amount: updatedPayment.amount,
          },
          attachments: [
            {
              filename: `Invoice-${paymentId}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      } catch (err) {
        console.error("Invoice/Email error:", err);
      }

      console.log("✅ Payment processed successfully");
    } catch (error) {
      console.error("Webhook handler error:", error);
    }
  },
};