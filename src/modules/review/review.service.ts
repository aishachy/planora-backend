import { prisma } from "../../lib/prisma";

export const ReviewService = {
  // ✅ Create Review
  createReview: async (payload: {
    rating: number;
    comment: string;
    userId: string;
    eventId: string;
  }) => {
    const { rating, comment, userId, eventId } = payload;

    // Optional: prevent duplicate review per user per event
    const existing = await prisma.review.findFirst({
      where: {
        userId,
        eventId,
      },
    });

    if (existing) {
      throw new Error("You already reviewed this event");
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        userId,
        eventId,
      },
    });

    return review;
  },

  // ✅ Get all reviews
  getAllReviews: async () => {
    return prisma.review.findMany({
      include: {
        user: true,
        event: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  // ✅ Get reviews by event
  getReviewsByEvent: async (eventId: string) => {
    return prisma.review.findMany({
      where: { eventId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  // ✅ Update review
  updateReview: async (
    id: string,
    payload: { rating?: number; comment?: string }
  ) => {
    const review = await prisma.review.update({
      where: { id },
      data: payload,
    });

    return review;
  },

  // ✅ Delete review
  deleteReview: async (id: string) => {
    await prisma.review.delete({
      where: { id },
    });

    return { message: "Review deleted successfully" };
  },
};