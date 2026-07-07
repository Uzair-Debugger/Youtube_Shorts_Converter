import express from 'express'
import cors from 'cors'
import router from './routes/index.js'

const app = express()

const isDev = process.env.NODE_ENV !== 'production';

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || origin === 'null') {
            return callback(null, true);
        }
        if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1|\.localhost)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        const allowed = process.env.CORS_ORIGIN?.split(',') || [];
        if (allowed.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));


app.use(function (req, res, next) {

    console.log(`${req.method} ${req.url}`)

    next();
})


app.use(express.json())

app.use('/api/v1', router)



export default app