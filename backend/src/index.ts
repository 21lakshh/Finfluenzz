import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { userRoute } from '../routes/user'
import { expensesRoute } from '../routes/expenses'
import { challengesRoute } from '../routes/challenges'

const app = new Hono()

app.use('*', cors())
app.route('/api/user', userRoute)
app.route('/api/expenses', expensesRoute)
app.route('/api/challenges', challengesRoute)

app.get('/health-check', (c) => c.json({ message: 'OK' }))


export default app
