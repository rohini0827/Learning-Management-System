import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js'
import educatorRouter from './routes/educatorRoutes.js'
import { clerkMiddleware } from '@clerk/express'
import connectCloudinary from './configs/cloudinary.js'
import courseRouter from './routes/courseRoute.js'
import userRouter from './routes/userRouts.js'
import quizRouter from './routes/quizRoutes.js'
import certificateRoutes from './routes/certificate.js';

// initialize express
const app = express()

//connect to database
await connectDB()
await connectCloudinary()

//middleware
app.use(cors())
app.use(clerkMiddleware())

// Apply express.json() globally for all routes EXCEPT webhooks
app.use(express.json())

//routes
app.get('/', (req, res)=> res.send("API Working"))
app.post('/clerk', express.json(), clerkWebhooks)
app.use('/api/educator', educatorRouter) // Remove express.json() from here since it's applied globally
app.use('/api/course', courseRouter) // Remove express.json() from here
app.use('/api/user', userRouter) // Remove express.json() from here
app.use('/api/quiz', quizRouter) // Remove express.json() from here - now it will use global middleware
app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks)
app.use('/api/certificate', certificateRoutes);

//port
const PORT = process.env.PORT || 5000

app.listen(PORT, ()=> {
    console.log(`Server is running on port ${PORT}`)
})