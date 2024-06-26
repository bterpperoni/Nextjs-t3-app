import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "$/server/api/trpc";
import { BookingStatus } from "@prisma/client";

export const bookingRouter = createTRPCRouter({

  bookingList: protectedProcedure.query(async ({ ctx }) => {
      return ctx.db.booking.findMany();
    }),


  bookingById: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
          return ctx.db.booking.findUnique({
            where: { id: input.id },
            include: {
              userPassenger: true
            },
          });
        }),
  
  bookingByRideId: protectedProcedure
  .input(
    z.object({
      rideId: z.number(),
    })
  ).query(async ({ ctx, input }) => {
    return ctx.db.booking.findMany({
      where: {
        rideId: input.rideId,
      },
      include: {
        userPassenger: true
      },
    });
  }),

  bookingCheckedByRideId: protectedProcedure
  .input(
    z.object({
      rideId: z.number(),
    })
  ).query(async ({ ctx, input }) => {
    return ctx.db.booking.findMany({
      where: {
        rideId: input.rideId,
        status: BookingStatus.CHECKED
      },
      include: {
        userPassenger: true
      },
    });
  }),

  bookingCompletedByRideId: protectedProcedure
  .input(
    z.object({
      rideId: z.number(),
    })
  ).query(async ({ ctx, input }) => {
    return ctx.db.booking.findMany({
      where: {
        rideId: input.rideId,
        status: BookingStatus.COMPLETED
      }
    });
  }),
    

  // Get a complete booking for a specific ride by a specific userName
  userBookingByRideId: protectedProcedure
  .input(
    z.object({
      rideId: z.number(),
    })
  ).query(async ({ ctx, input }) => {
    return ctx.db.booking.findMany({
      where: {
        rideId: input.rideId,
        userId: ctx.session.user.id,
      },
      include: {
        userPassenger: true
      },
    });
  }),


  create: protectedProcedure
    .input(
      z.object({
        rideId: z.number(),
        userId: z.string(),
        pickupPoint: z.string(),
        pickupLatitude: z.number(),
        pickupLongitude: z.number(),
        price: z.string(),
        status: z.nativeEnum(BookingStatus),
      })
    ).mutation(async ({ ctx, input }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return ctx.db.booking.create({
        data: {
          rideId: input.rideId,
          userId: input.userId,
          pickupPoint: input.pickupPoint,
          pickupLatitude: input.pickupLatitude,
          pickupLongitude: input.pickupLongitude,
          price: input.price,
          status: BookingStatus.CREATED
        },
      });
    }),


  updateStatusToCheck: protectedProcedure
    .input(
      z.object({
        bookingId: z.number()
      })
    ).mutation(async ({ ctx, input }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return ctx.db.booking.update({
        where: {
          id: input.bookingId,
        },
        data: {
          status: BookingStatus.CHECKED,
        },
      });
    }),

    updateStatusToCompleted: protectedProcedure
    .input(
      z.object({
        bookingId: z.number()
      })
    ).mutation(async ({ ctx, input }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return ctx.db.booking.update({
        where: {
          id: input.bookingId,
        },
        data: {
          status: BookingStatus.COMPLETED,
        },
      });
    }),

    updatePriceRide: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        price: z.string(),
      })
    ).mutation(async ({ ctx, input }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return ctx.db.booking.update({
        where: {
          id: input.bookingId,
        },
        data: {
          price: input.price,
        },
      });
    }),


  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        rideId: z.number(),
        userId: z.string(),
        pickupPoint: z.string(),
        pickupLatitude: z.number(),
        pickupLongitude: z.number(),
        price: z.string(),
        status: z.nativeEnum(BookingStatus),
      })
    ).mutation(async ({ ctx, input }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return ctx.db.booking.update({
        where: {
          id: input.id,
        },
        data: {
          rideId: input.rideId,
          userId: input.userId,
          pickupPoint: input.pickupPoint,
          pickupLatitude: input.pickupLatitude,
          pickupLongitude: input.pickupLongitude,
          price: input.price,
          status: BookingStatus.UPDATED,
        },
      });
    }),


  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    ).mutation(async ({ ctx, input }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return ctx.db.booking.delete({
        where: {
          id: input.id
        },
      });
    }),
});
