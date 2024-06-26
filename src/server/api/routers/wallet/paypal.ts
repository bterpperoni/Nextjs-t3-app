import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "$/server/api/trpc";

export const paypalRouter = createTRPCRouter({

    paypalTransactionList: protectedProcedure.query(async ({ ctx }) => {
        const paypalList = await ctx.db.paypalTransaction.findMany();
        return paypalList;
    }),

    paypalTransactionById: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.paypalTransaction.findUnique({
                where: { id: input.id },
            });
        }),

    paypalTransactionListByUser: protectedProcedure
        .input(z.object({ walletId: z.string() }))
        .query(async ({ ctx, input }) => {
            const paypalList = await ctx.db.paypalTransaction.findMany({
                where: { walletId: input.walletId },
            });
            return paypalList;
        }),

    paypalTransactionListByOrder: protectedProcedure
        .query(async ({ ctx }) => {
            const paypalList = await ctx.db.paypalTransaction.findMany({
                where: { type: "deposit" },
            });
            return paypalList;
        }),

    paypalTransactionListByPayout: protectedProcedure
        .query(async ({ ctx }) => {
            const paypalList = await ctx.db.paypalTransaction.findMany({
                where: { type: "withdraw" },
            });
            return paypalList;
        }),

    createOrder: protectedProcedure
        .input(z.object(
            { 
                orderId: z.string(),
                walletId: z.string(),
                amount: z.string(),
                type: z.string()
            }))
        .mutation(async ({ ctx, input }) => {
            // simulate a slow db call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return ctx.db.paypalTransaction.create({
                data: {
                    orderId: input.orderId,
                    walletId: input.walletId,
                    amount: input.amount,
                    type: input.type
                },
            });
        }),

        createPayout: protectedProcedure
        .input(z.object(
            { 
                payoutId: z.string(),
                walletId: z.string(),
                amount: z.string(),
                type: z.string()
            }))
        .mutation(async ({ ctx, input }) => {
            // simulate a slow db call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return ctx.db.paypalTransaction.create({
                data: {
                    payoutId: input.payoutId,
                    walletId: input.walletId,
                    amount: input.amount,
                    type: input.type
                },
            });
        }),

    update: protectedProcedure
        .input(z.object(
            { 
                id: z.number(),
                walletId: z.string(),
                amount: z.string(),
            }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.paypalTransaction.update({
                where: { id: input.id },
                data: {
                    walletId: input.walletId,
                    amount: input.amount
                },
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.paypalTransaction.delete({
                where: { id: input.id },
            });
        }),
});