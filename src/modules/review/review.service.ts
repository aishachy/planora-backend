import { prisma } from "../../lib/prisma.js";

export const ReviewService = {
  // Create Review
  createReview: async (payload: {
    rating: number;
    comment: string;
    userId: string;
    eventId: string;
  }) => {
    const { rating, comment, userId, eventId } = payload;

    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    if (!comment || comment.trim().length < 3) {
      throw new Error("Comment must be at least 3 characters");
    }

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

    return review;
  },

  // Get all reviews
  getAllReviews: async () => {
    return prisma.review.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
        },
        event: {
          select: { id: true, title: true, date: true, venue: true, fee: true, createdAt: true, updatedAt: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  // Get reviews by event
  getReviewsByEvent: async (eventId: string) => {
    return prisma.review.findMany({
      where: { eventId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  // Update review
  updateReview: async (
    id: string, userId: string, payload: { rating?: number; comment?: string; }) => {
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      throw new Error("Review not found");
    }

    if (existingReview.userId !== userId) {
      throw new Error("You are not authorized to update this review");
    }
    if (
      payload.rating !== undefined &&
      (payload.rating < 1 || payload.rating > 5)
    ) {
      throw new Error("Rating must be between 1 and 5");
    }

    //  Validate comment if provided
    if (
      payload.comment !== undefined &&
      payload.comment.trim().length < 3
    ) {
      throw new Error("Comment must be at least 3 characters");
    }

    const review = await prisma.review.update({
      where: { id },
      data: payload,
    });

    return review;
  },

  // ✅ Delete review
  deleteReview: async (id: string, userId: string) => {
    // Find review
    const review = await prisma.review.findUnique({
      where: { id },
    });

    // Check review exists
    if (!review) {
      throw new Error("Review not found");
    }

    // Check ownership
    if (review.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Check delete time limit (24 hours)
    const createdAt = new Date(review.createdAt).getTime();
    const now = Date.now();

    const diffHours = (now - createdAt) / (1000 * 60 * 60);

    if (diffHours > 24) {
      throw new Error("Review delete period expired");
    }

    // Delete review
    await prisma.review.delete({
      where: { id },
    });

    return {
      message: "Review deleted successfully",
    };
  },


  getEventRatingStats: async (eventId: string) => {
    const avg = await prisma.review.aggregate({
      where: { eventId },
      _avg: {
        rating: true,
      },
      _count: true,
    });

    return {
      averageRating: avg._avg.rating || 0,
      totalReviews: avg._count,
    };
  },
};

