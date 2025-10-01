import { Hono } from "hono";
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { sign } from 'hono/jwt'
import prisma from '../client/client'
import { authmiddleware } from '../middleware/middleware'
import { signinSchema, signupSchema } from '../validation/zod'

export const userRoute = new Hono<{
    Bindings: { JWT_SECRET: string, DATABASE_URL: string },
    Variables: { userId: string }
}>()

userRoute.post("/signup", async (c) => {

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

userRoute.post("/signin", async (c) => {
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

userRoute.get('/me', authmiddleware, async (c) => {
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
  
  // Level up user manually (if they want to level up when eligible)
  userRoute.post('/levelup', authmiddleware, async (c) => {
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
  userRoute.post('/fix-level', authmiddleware, async (c) => {
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
