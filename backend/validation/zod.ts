import { z } from "zod";

export const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    username: z.string().min(3),
    age: z.number().min(18),
    goal: z.string().min(3),
    employmentType: z.string().min(3),
    financeKnowledge: z.string().min(3),
    earn: z.boolean(),
    earnedXp: z.number().min(0).optional(),
    completedChallenges: z.number().min(0).optional(),
    currentLevel: z.number().min(1).max(20).optional(),
  })
  
export const signinSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  })

export const addExpenseSchema = z.object({
    amount: z.number().min(0),
    category: z.string().min(3),
    description: z.string().min(3),
  })

export const addChallengeSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(3),
    category: z.string().min(3),
    difficulty: z.string().min(3),
    xpReward: z.number().min(0),
    deadline: z.string().min(3),
    emoji: z.string().min(1),
    completed: z.boolean().optional(),
})