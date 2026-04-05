/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "../../lib/prisma.js";
import { PaymentStatus } from "../../generated/prisma/enums.js";
import { uploadFileToCloudinary } from "../../app/config/cloudinary.config.js";
import { sendEmail } from "../../utils/email.js";
import { generateInvoicePdf } from "../../utils/payment.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export const PaymentService = {
  // 1️⃣ Create payment record in DB
  createPaymentRecord: (data: { registrationId: string; amount: number; transactionId: string }) => {
    return prisma.payment.create({
      data: {
        registrationId: data.registrationId,
        amount: data.amount,
        status: PaymentStatus.PENDING,
        transactionId: data.transactionId,
      },
    });
  },

  // 2️⃣ Create Stripe Checkout session
  createStripeCheckoutSession: (payment: any, registrationId: string, amount: number) => {
    return stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Event Ticket" },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      metadata: { registrationId, paymentId: payment.id },
      success_url: "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}", // ✅ full URL
      cancel_url: "http://localhost:3000/cancel", 
    // success_url: `${process.env.FRONTEND_URL}/payment-success`,
    // cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
  });
  },

// 3️⃣ Handle Stripe webhook events
handlerStripeWebhookEvent: async (event: Stripe.Event) => {
  const existingPayment = await prisma.payment.findFirst({
    where: { stripeEventId: event.id },
  });

  if (existingPayment) {
    console.log(`Event ${event.id} already processed.`);
    return { message: `Event ${event.id} already processed.` };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const registrationId = session.metadata?.registrationId;
      const paymentId = session.metadata?.paymentId;

      if (!registrationId || !paymentId) return { message: "Missing metadata" };

      const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: { user: true, event: true, payment: true },
      });

      if (!registration) return { message: "Registration not found" };

      let pdfBuffer: Buffer | null = null;

      const result = await prisma.$transaction(async (tx: { payment: { update: (arg0: { where: { id: any; } | { id: any; }; data: { status: "COMPLETED" | "FAILED"; stripeEventId: string; paymentGatewayData: any; } | { invoiceUrl: string; }; }) => any; }; }) => {
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status:
              session.payment_status === "paid"
                ? PaymentStatus.COMPLETED
                : PaymentStatus.FAILED,
            stripeEventId: event.id,
            paymentGatewayData: session,
          },
        });

        let invoiceUrl: string | null = null;

        if (session.payment_status === "paid") {
          try {
            pdfBuffer = await generateInvoicePdf({
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
              `registrations/invoices/invoice-${paymentId}-${Date.now()}.pdf`
            );

            invoiceUrl = cloudinaryResponse?.secure_url;

            await tx.payment.update({
              where: { id: paymentId },
              data: { invoiceUrl },
            });
          } catch (err) {
            console.error("Error generating/uploading invoice PDF:", err);
          }
        }

        if (session.payment_status === "paid" && invoiceUrl) {
          try {
            await sendEmail({
              to: registration.user.email,
              subject: `Payment Confirmation & Invoice for ${registration.event.title}`,
              templateName: "invoice",
              templateData: {
                registrationName: registration.user.name,
                invoiceId: result?.updatedPayment.id,
                transactionId: updatedPayment.transactionId,
                paymentDate: new Date().toLocaleDateString(),
                eventName: registration.event.title,
                amount: updatedPayment.amount,
                invoiceUrl,
              },
              attachments: [
                {
                  filename: `Invoice-${paymentId}.pdf`,
                  content: pdfBuffer || Buffer.from(""),
                  contentType: "application/pdf",
                },
              ],
            });
          } catch (emailErr) {
            console.error("Error sending invoice email:", emailErr);
          }
        }

        return { updatedPayment, invoiceUrl };
      });

      console.log(`Payment processed for registration ${registrationId}`);
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return { message: `Webhook Event ${event.id} processed successfully` };
},
};