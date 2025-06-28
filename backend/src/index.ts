import { Hono } from 'hono'
import prisma from '../client/client'
import bcrypt from 'bcryptjs'
import { sign } from 'hono/jwt'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { authmiddleware } from '../middleware/middleware'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3),
  age: z.number().min(18),
  goal: z.string().min(3),
  employmentType: z.string().min(3),
  financeKnowledge: z.string().min(3),
  earn: z.boolean(),
})

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const app = new Hono<{ Bindings: { JWT_SECRET: string, DATABASE_URL: string }, Variables: { userId: string } }>()

app.use('*', cors())

app.post('/api/signup', async (c) => {

  try {
    const { email, password, username, age, goal, employmentType, financeKnowledge, earn } = await c.req.json()

    const parsed = signupSchema.safeParse({ email, password, username, age, goal, employmentType, financeKnowledge, earn })

    if (!parsed.success) {
      return c.json({ error: parsed.error.message }, 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, username, age, goal, employmentType, financeKnowledge, earn },
      select: {
        id: true,
        email: true,
        username: true,
        age: true,
        goal: true,
        employmentType: true,
        financeKnowledge: true,
        earn: true,
      }
    })

    const jwtSecret = c.env?.JWT_SECRET || process.env.JWT_SECRET || 'PMMMT'
    const jwtToken = await sign({ userId: user.id }, jwtSecret)

    return c.json({ user, token: jwtToken })
  } catch (error) {
    console.error('Signup error:', error)
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return c.json({ error: 'Email or username already exists' }, 409)
      }
      
      if (error.code === 'P2021') {
        return c.json({ error: 'Database table does not exist. Run: npx prisma db push' }, 500)
      }
    }
    
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : 'Unknown'
    
    return c.json({ 
      error: 'Failed to signup user',
      details: errorMessage,
      code: errorCode
    }, 500)
  }
})

app.post('/api/signin', async (c) => {
  try {
    const body = await c.req.json()

    const parsed = signinSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ error: parsed.error.message }, 400)
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email }
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password)

    if (!isPasswordValid) {
      return c.json({ error: 'Invalid password' }, 401)
    }

    const jwtSecret = c.env?.JWT_SECRET || process.env.JWT_SECRET || 'PMMMT'
    const jwtToken = await sign({ userId: user.id }, jwtSecret)

    return c.json({ user, token: jwtToken })
  } catch (error) {
    return c.json({ error: 'Failed to signin user' }, 500)
  }
})

app.get('/api/me', authmiddleware, async (c) => {
  const userId = c.get('userId')
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      age: true,
      goal: true,
      employmentType: true,
      financeKnowledge: true,
      earn: true,
    }
  })
  return c.json({ user })
})

const addExpenseSchema = z.object({
  amount: z.number().min(0),
  category: z.string().min(3),
  description: z.string().min(3),
})

app.post('/api/expense/add', authmiddleware, async (c) => {
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

app.get('/api/expense/all', authmiddleware, async (c) => {
  const userId = c.get('userId')
  const expenses = await prisma.expense.findMany({
    where: { userId }
  })
  return c.json({ expenses })
})

app.delete('/api/expense/delete/:id', authmiddleware, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()
  const expense = await prisma.expense.delete({
    where: { id, userId }
  })
  return c.json({ expense })
})

export default app
