import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { errorHandler } from './middlewares/error.middlewares.js';


const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));


app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static('public'))
app.use(cookieParser());
app.use(morgan('dev'))


//import index route
import indexRoute from './routes/index.js';

app.use('/api/v1',indexRoute)
app.use(errorHandler);
export {app}