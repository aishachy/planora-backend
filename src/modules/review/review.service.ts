import { prisma } from "../../lib/prisma.js";

export const ReviewService = {
  // CREATE REVIEW
  createReview: async (payload: {
    rating: number;
    comment: string;
    userId: string;
    eventId: string;
  }) => {
    const { rating, comment, userId, eventId } = payload;

    // ✅ rating validation
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // ✅ safe comment validation
    if (!comment || comment.trim().length < 3) {
      throw new Error("Comment must be at least 3 characters");
    }

    // ❌ prevent duplicate review
    const existing = await prisma.review.findFirst({
      where: { userId, eventId },
    });

    if (existing) {
      throw new Error("You already reviewed this event");
    }

    return prisma.review.create({
      data: {
        rating,
        comment: comment.trim(),
        userId,
        eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  },

  // GET ALL REVIEWS
  getAllReviews: async () => {
    return prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            venue: true,
            fee: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // GET BY EVENT
  getReviewsByEvent: async (eventId: string) => {
    if (!eventId) throw new Error("Event ID is required");

    return prisma.review.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // UPDATE REVIEW
  updateReview: async (
    id: string,
    userId: string,
    payload: { rating?: number; comment?: string }
  ) => {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) throw new Error("Review not found");

    if (review.userId !== userId) {
      throw new Error("You are not authorized to update this review");
    }

    if (payload.rating !== undefined) {
      if (payload.rating < 1 || payload.rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }
    }

    if (payload.comment !== undefined) {
      if (payload.comment.trim().length < 3) {
        throw new Error("Comment must be at least 3 characters");
      }
    }

    return prisma.review.update({
      where: { id },
      data: {
        ...payload,
        comment: payload.comment?.trim(),
      },
    });
  },

  // DELETE REVIEW
  deleteReview: async (id: string, userId: string) => {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) throw new Error("Review not found");

    if (review.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // optional time restriction (safe now)
    const createdAt = new Date(review.createdAt).getTime();
    const now = Date.now();
    const diffHours = (now - createdAt) / (1000 * 60 * 60);

    if (diffHours > 24) {
      throw new Error("Review delete period expired (24h limit)");
    }

    return prisma.review.delete({
      where: { id },
    });
  },

  // STATS
  getEventRatingStats: async (eventId: string) => {
    if (!eventId) throw new Error("Event ID is required");

    const stats = await prisma.review.aggregate({
      where: { eventId },
      _avg: { rating: true },
      _count: true,
    });

    return {
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count,
    };
  },
};