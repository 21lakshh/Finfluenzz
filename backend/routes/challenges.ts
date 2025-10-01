import { Hono } from "hono"
import { authmiddleware } from "../middleware/middleware"
import prisma from "../client/client"
import { addChallengeSchema } from "../validation/zod"

export const challengesRoute = new Hono<{
    Bindings: { JWT_SECRET: string, DATABASE_URL: string },
    Variables: { userId: string }
}>()

challengesRoute.post('/challenge/add', authmiddleware, async (c) => {
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
challengesRoute.get('/challenge/all', authmiddleware, async (c) => {
    const userId = c.get('userId')
    const challenges = await prisma.challenge.findMany({
        where: { userId }
    })
    return c.json({ challenges })
})

// delete all challenges (must come before /:id route)
challengesRoute.delete('/challenge/delete/all', authmiddleware, async (c) => {
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
challengesRoute.delete('/challenge/delete/:id', authmiddleware, async (c) => {
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