/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";

import { prisma } from "../../lib/prisma";
import { uploadFileToCloudinary } from "../../app/config/cloudinary.config";
import { sendEmail } from "../../utils/email";
import { generateInvoicePdf } from "../../utils/payment";
import { PaymentStatus } from "../../generated/prisma/enums";


export const PaymentService = {
  handlerStripeWebhookEvent: async (event: Stripe.Event) => {
    // Prevent duplicate processing
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

        if (!registrationId || !paymentId) {
          console.error("Missing metadata in webhook event");
          return { message: "Missing metadata" };
        }

        // Fetch registration with user and event
        const registration = await prisma.registration.findUnique({
          where: { id: registrationId },
          include: { user: true, event: true, payment: true },
        });

        if (!registration) {
          console.error(`Registration ${registrationId} not found`);
          return { message: "Registration not found" };
        }

        let pdfBuffer: Buffer | null = null;

        // Transaction: update payment status and store invoice URL
        const result = await prisma.$transaction(async (tx) => {
          const updatedPayment = await tx.payment.update({
            where: { id: paymentId },
            data: {
              status:
                session.payment_status === "completed"
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

              // Update payment with invoice URL
              await tx.payment.update({
                where: { id: paymentId },
                data: { invoiceUrl }, // Make sure invoiceUrl exists in your Prisma schema
              });

              console.log(`Invoice generated and uploaded for payment ${paymentId}`);
            } catch (err) {
              console.error("Error generating/uploading invoice PDF:", err);
            }
          }

          return { updatedPayment, invoiceUrl };
        });

        // Send invoice email
        if (session.payment_status === "paid" && result.invoiceUrl) {
          try {
            await sendEmail({
              to: registration.user.email,
              subject: `Payment Confirmation & Invoice for ${registration.event.title}`,
              templateName: "invoice",
              templateData: {
                registrationName: registration.user.name,
                invoiceId: result.updatedPayment.id,
                transactionId: result.updatedPayment.transactionId,
                paymentDate: new Date().toLocaleDateString(),
                eventName: registration.event.title,
                amount: result.updatedPayment.amount,
                invoiceUrl: result.invoiceUrl,
              },
              attachments: [
                {
                  filename: `Invoice-${paymentId}.pdf`,
                  content: pdfBuffer || Buffer.from(""),
                  contentType: "application/pdf",
                },
              ],
            });

            console.log(`Invoice email sent to ${registration.user.email}`);
          } catch (emailErr) {
            console.error("Error sending invoice email:", emailErr);
          }
        }

        console.log(
          `Payment ${session.payment_status} processed for registration ${registrationId}`
        );
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as any;
        console.log(`Checkout session ${session.id} expired`);
        break;
      }

      case "payment_intent.payment_failed": {
        const session = event.data.object as any;
        console.log(`Payment intent ${session.id} failed`);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { message: `Webhook Event ${event.id} processed successfully` };
  },
};