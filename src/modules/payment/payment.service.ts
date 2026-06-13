/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "../../lib/prisma.js";
import { PaymentStatus, RegistrationStatus } from "../../generated/prisma/enums.js";
import { uploadFileToCloudinary } from "../../app/config/cloudinary.config.js";
import { sendEmail } from "../../utils/email.js";
import { generateInvoicePdf } from "../../utils/payment.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export const PaymentService = {
  // CREATE PAYMENT RECORD
  createPaymentRecord: (data: {
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

  // CREATE STRIPE SESSION
  createStripeCheckoutSession: (payment: any, registrationId: string, amount: number) => {
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

      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });
  },

  // STRIPE WEBHOOK HANDLER
  handlerStripeWebhookEvent: async (event: Stripe.Event) => {
    const existingEvent = await prisma.payment.findFirst({
      where: {
        stripeEventId: event.id,
      },
    });

    if (existingEvent) {
      return { message: "Event already processed" };
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;

        const registrationId = session.metadata?.registrationId;
        const paymentId = session.metadata?.paymentId;

        if (!registrationId || !paymentId) {
          return { message: "Missing metadata" };
        }

        const registration = await prisma.registration.findUnique({
          where: { id: registrationId },
          include: { user: true, event: true },
        });

        if (!registration) {
          return { message: "Registration not found" };
        }

        let pdfBuffer: Buffer | null = null;

        const result = await prisma.$transaction(async (tx) => {
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

          if (session.payment_status === "paid") {
          await tx.registration.update({
            where: { id: registrationId },
            data: {
              status: RegistrationStatus.APPROVED,
            },
          });

            await tx.invitation.updateMany({
              where: {
                eventId: registration.eventId,
                userId: registration.userId,
              },
              data: {
                status: "PENDING_PAYMENT_APPROVAL",
              },
            });

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
                `invoices/invoice-${paymentId}-${Date.now()}.pdf`
              );

              await tx.payment.update({
                where: { id: paymentId },
                data: {
                  invoiceUrl: cloudinaryResponse?.secure_url,
                },
              });
            } catch (err) {
              console.error("Invoice error:", err);
            }

            try {
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
                attachments: pdfBuffer
                  ? [
                      {
                        filename: `Invoice-${paymentId}.pdf`,
                        content: pdfBuffer,
                        contentType: "application/pdf",
                      },
                    ]
                  : [],
              });
            } catch (emailErr) {
              console.error("Email error:", emailErr);
            }
          }

          return { updatedPayment };
        });

        console.log("Payment completed:", result.updatedPayment.id);
        break;
      }

      default:
        console.log("Unhandled event:", event.type);
    }

    return { message: "Webhook processed" };
  },
};