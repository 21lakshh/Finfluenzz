import prisma from "../client/client"
import { authmiddleware } from "../middleware/middleware"
import { Hono } from "hono"
import { addExpenseSchema } from "../validation/zod"

export const expensesRoute = new Hono<{
    Bindings: { JWT_SECRET: string, DATABASE_URL: string },
    Variables: { userId: string }
}>()

expensesRoute.post('/expense/add', authmiddleware, async (c) => {
    const userId = c.get('userId')
    const { amount, category, description } = await c.req.json()

    const parsed = addExpenseSchema.safeParse({ amount, category, description })

    if (!parsed.success) {
        return c.json({ error: parsed.error.message }, 400)
    }

    const expense = await prisma.expense.create({
        data: { amount, category, description, userId },
        select: {
            id: true,
            amount: true,
            category: true,
            description: true,
        }
    })
    return c.json({ expense })
})

expensesRoute.get('/expense/all', authmiddleware, async (c) => {
    const userId = c.get('userId')
    const expenses = await prisma.expense.findMany({
        where: { userId }
    })
    return c.json({ expenses })
})

expensesRoute.delete('/expense/delete/:id', authmiddleware, async (c) => {
    const userId = c.get('userId')
    const { id } = c.req.param()
    const expense = await prisma.expense.delete({
        where: { id, userId }
    })
    return c.json({ expense })
})