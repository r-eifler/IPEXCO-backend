import { auth } from './middleware/auth';
import { userRouter } from './routes/user';
import createError from 'http-errors';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';

import logger from 'morgan';
import sassMiddleware from 'node-sass-middleware';

import errorMiddleware from './middleware/error.middleware';

import { projectRouter } from './routes/project';
import { indexRouter } from './routes';
import { planPropertyRouter } from './routes/plan_property';
import { plannerRouter } from './routes/planner-runs/planner';
import { iterationStepRouter } from './routes/iteration-step';
import { demoRouter } from './routes/demo';
import { userStudyRouter } from './routes/user-study/user-study';
import { userStudyUserRouter } from './routes/user-study/user-study-user';
import { Environment } from './environment';

import * as dotenv from "dotenv";
import { metaStudyRouter } from './routes/user-study/meta-study';
import { userStudyDataRouter } from './routes/user-study/user-study-data';
import { runnerRouter } from './routes/runner';
import { pddlRouter } from './routes/pddl';
import { LLMRouter } from './routes/llm-connector';
dotenv.config();

console.log('-------- IPEXCO BACK END ---------');

const results_folder = path.join(__dirname, 'data/results');
const uploads_folder = path.join(__dirname, 'data/uploads');
const images_folder = path.join(__dirname, 'data/images')

// create folders if not already exist
console.log('---> statically served path');

console.log(uploads_folder);
if(! fs.existsSync(uploads_folder)){
  fs.mkdirSync(uploads_folder)
  console.log(uploads_folder + " created");
}

console.log(results_folder);
if(! fs.existsSync(results_folder)){
  fs.mkdirSync(results_folder)
  console.log(results_folder + " created");
}

console.log(images_folder);
if(! fs.existsSync(images_folder)){
  fs.mkdirSync(images_folder)
  console.log(images_folder + " created");
}

export const environment = new Environment();
console.log(environment)

const app = express();
const cors = require('cors');
const mongoose = require('mongoose');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// app.use(auth);
app.use('/', indexRouter);

app.use('/api/pddl', pddlRouter);

app.use('/api/users', userRouter);

app.use('/api/user-study-users', userStudyUserRouter);
app.use('/api/meta-study', metaStudyRouter);
app.use('/api/user-study', userStudyRouter);
app.use('/api/user-study-data', userStudyDataRouter);

app.use('/api/demo', demoRouter);
app.use('/api/iteration-step', iterationStepRouter);

app.use('/api/plan-property', planPropertyRouter);

app.use('/uploads', express.static(uploads_folder));
app.use('/results', express.static(results_folder));
app.use('/images', express.static(images_folder));

app.use('/api/runner', runnerRouter);
app.use('/api/run', iterationStepRouter);

app.use('/api/project', projectRouter);

app.use('/api/llm', LLMRouter);

// catch 404 and forward to error handler
app.all('*', (req, res, next) => {
  next(createError('404'));
});

// error handler
app.use(errorMiddleware);


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


// Data base connection
const port = environment.port || 3000;
const mongodbURL = process.env.MONGO || 'mongodb://localhost/ipexco';
mongoose.connect(mongodbURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('connected to DB');
      // mongoose.connection.db.dropDatabase();

    })
    .catch((err: { message: any; }) => console.log(`something went wrong ${err.message}`));


app.listen(port , () => console.log(`Backend server port working on ${port}`));

module.exports = app;
