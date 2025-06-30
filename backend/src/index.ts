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
  earnedXp: z.number().min(0),
  completedChallenges: z.number().min(0),
  currentLevel: z.number().min(1),
})

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const app = new Hono<{ Bindings: { JWT_SECRET: string, DATABASE_URL: string }, Variables: { userId: string } }>()

app.use('*', cors())

app.post('/api/signup', async (c) => {

  try {
    const { email, password, username, age, goal, employmentType, financeKnowledge, earn, earnedXp, completedChallenges, currentLevel } = await c.req.json()

    const parsed = signupSchema.safeParse({ email, password, username, age, goal, employmentType, financeKnowledge, earn, earnedXp, completedChallenges, currentLevel })

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
        earnedXp: true,
        completedChallenges: true,
        currentLevel: true,
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
      earnedXp: true,
      completedChallenges: true,
      currentLevel: true,
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

// challenges 
const addChallengeSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  category: z.string().min(3),
  difficulty: z.string().min(3),
  xpReward: z.number().min(0),
  deadline: z.string().min(3),
  emoji: z.string().min(1),
  completed: z.boolean().optional(),
})

app.post('/api/challenge/add', authmiddleware, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  // Check if it's a single challenge or array of challenges
  const challengesData = Array.isArray(body) ? body : [body]

  // Validate each challenge
  const validatedChallenges = []
  for (const challengeData of challengesData) {
    const { title, description, category, difficulty, xpReward, deadline, emoji, completed } = challengeData
    const parsed = addChallengeSchema.safeParse({ title, description, category, difficulty, xpReward, deadline, emoji, completed })
    
    if (!parsed.success) {
      return c.json({ error: `Invalid challenge data: ${parsed.error.message}` }, 400)
    }
    
    validatedChallenges.push({
      title,
      description,
      category,
      difficulty,
      xpReward,
      deadline,
      emoji,
      userId,
      completed
    })
  }

  try {
    // Create all challenges in a single transaction
    const challenges = await prisma.challenge.createMany({
      data: validatedChallenges,
      skipDuplicates: true
    })

    // Get the created challenges with full data
    const createdChallenges = await prisma.challenge.findMany({
      where: {
        userId,
        title: { in: validatedChallenges.map(c => c.title) }
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        xpReward: true,
        deadline: true,
        emoji: true,
        completed: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: validatedChallenges.length
    })

    return c.json({ 
      challenges: createdChallenges,
      count: challenges.count 
    })
  } catch (error) {
    console.error('Error creating challenges:', error)
    return c.json({ error: 'Failed to create challenges' }, 500)
  }
})

// get all current challenges
app.get('/api/challenge/all', authmiddleware, async (c) => {
  const userId = c.get('userId')
  const challenges = await prisma.challenge.findMany({
    where: { userId }
  })
  return c.json({ challenges })
})

// delete all challenges (must come before /:id route)
app.delete('/api/challenge/delete/all', authmiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const result = await prisma.challenge.deleteMany({
      where: { userId }
    })
    return c.json({ 
      message: 'All challenges deleted successfully',
      count: result.count 
    })
  } catch (error) {
    console.error('Error deleting all challenges:', error)
    return c.json({ error: 'Failed to delete all challenges' }, 500)
  }
})

// completed challenge, upon delete reward xp to user
app.delete('/api/challenge/delete/:id', authmiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { id } = c.req.param()
    
    const challenge = await prisma.challenge.delete({
      where: { id, userId }
    })
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (user) {
      // Calculate new XP and check for level up
      const newXp = user.earnedXp + challenge.xpReward
      const newCompletedChallenges = user.completedChallenges + 1
      
      // XP requirements for leveling (same as frontend)
      const XP_REQUIREMENTS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450]
      
      // Determine new level based on XP (automatic level up)
      let newLevel = 1
      for (let i = XP_REQUIREMENTS.length - 1; i >= 0; i--) {
        if (newXp >= XP_REQUIREMENTS[i]) {
          newLevel = i + 1
          break
        }
      }
      
      await prisma.user.update({
        where: { id: userId },
        data: { 
          earnedXp: newXp,
          completedChallenges: newCompletedChallenges,
          currentLevel: newLevel
        }
      })
    }
    
    return c.json({ challenge })
  } catch (error) {
    console.error('Error completing challenge:', error)
    return c.json({ error: 'Failed to complete challenge' }, 500)
  }
})

// Level up user manually (if they want to level up when eligible)
app.post('/api/user/levelup', authmiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    // XP requirements for leveling
    const XP_REQUIREMENTS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450]
    
    // Check if user can level up
    const currentLevel = user.currentLevel
    const currentXp = user.earnedXp
    const xpForNextLevel = XP_REQUIREMENTS[currentLevel] || XP_REQUIREMENTS[XP_REQUIREMENTS.length - 1]
    
    if (currentXp < xpForNextLevel || currentLevel >= XP_REQUIREMENTS.length) {
      return c.json({ error: 'Not enough XP to level up or already at max level' }, 400)
    }
    
    // Level up the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { currentLevel: currentLevel + 1 },
      select: {
        id: true,
        email: true,
        username: true,
        age: true,
        goal: true,
        employmentType: true,
        financeKnowledge: true,
        earn: true,
        earnedXp: true,
        completedChallenges: true,
        currentLevel: true,
      }
    })
    
    return c.json({ 
      user: updatedUser,
      message: `Congratulations! You are now level ${updatedUser.currentLevel}!`
    })
  } catch (error) {
    console.error('Error leveling up user:', error)
    return c.json({ error: 'Failed to level up user' }, 500)
  }
})

// Recalculate and fix user level based on current XP
app.post('/api/user/fix-level', authmiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    // XP requirements for leveling
    const XP_REQUIREMENTS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450]
    
    // Calculate correct level based on current XP
    let correctLevel = 1
    for (let i = XP_REQUIREMENTS.length - 1; i >= 0; i--) {
      if (user.earnedXp >= XP_REQUIREMENTS[i]) {
        correctLevel = i + 1
        break
      }
    }
    
    // Update user level if it's incorrect
    if (correctLevel !== user.currentLevel) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { currentLevel: correctLevel },
        select: {
          id: true,
          email: true,
          username: true,
          age: true,
          goal: true,
          employmentType: true,
          financeKnowledge: true,
          earn: true,
          earnedXp: true,
          completedChallenges: true,
          currentLevel: true,
        }
      })
      
      return c.json({ 
        user: updatedUser,
        message: `Level corrected! You are now level ${correctLevel} (was ${user.currentLevel})`,
        levelChanged: true,
        oldLevel: user.currentLevel,
        newLevel: correctLevel
      })
    } else {
      return c.json({ 
        user,
        message: `Level is already correct: Level ${correctLevel}`,
        levelChanged: false
      })
    }
  } catch (error) {
    console.error('Error fixing user level:', error)
    return c.json({ error: 'Failed to fix user level' }, 500)
  }
})

export default app
