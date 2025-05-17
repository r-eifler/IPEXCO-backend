import cookieParser from 'cookie-parser';
import express from 'express';
import createError from 'http-errors';
import path from 'path';
import { userRouter } from './routes/user';

import logger from 'morgan';
import errorMiddleware from './middleware/error.middleware';

import { Environment } from './environment';
import { indexRouter } from './routes';
import { demoRouter } from './routes/demo';
import { iterationStepRouter } from './routes/iteration-step';
import { planPropertyRouter } from './routes/plan_property';
import { projectRouter } from './routes/project';
import { userStudyRouter } from './routes/user-study/user-study';

import * as dotenv from "dotenv";
import { LLMRouter } from './routes/llm-connector';
import { pddlRouter } from './routes/pddl';
import { plannerRouter } from './routes/planner';
import { participantDistributerRouter } from './routes/user-study/participant-distributer';
import { userStudyExecutionRouter } from './routes/user-study/user-study-execution';

import { flightPlanTreeRouter } from './routes/beluga/flight-plan-tree';
import { flightSectionPlanRouter } from './routes/beluga/flight-section-plan';
import { domainSpecificationRouter } from './routes/domain_specification';
import { explainerRouter } from './routes/explainer';
import { planRouter } from './routes/plan';
import { promptRouter } from './routes/prompt';
import { serviceRouter } from './routes/services';
import { flightSectionExplanationRouter } from './routes/beluga/flight-section-explanations';



dotenv.config();

console.log('-------- IPEXCO BACK END ---------');

const results_folder = path.join(__dirname, 'data/results');
const uploads_folder = path.join(__dirname, 'data/uploads');
const images_folder = path.join(__dirname, 'data/images')


// create folders if not already exist
console.log('---> statically served path');

// console.log(uploads_folder);
// if(! fs.existsSync(uploads_folder)){
//   fs.mkdirSync(uploads_folder)
//   console.log(uploads_folder + " created");
// }

// console.log(results_folder);
// if(! fs.existsSync(results_folder)){
//   fs.mkdirSync(results_folder)
//   console.log(results_folder + " created");
// }

// console.log(images_folder);
// if(! fs.existsSync(images_folder)){
//   fs.mkdirSync(images_folder)
//   console.log(images_folder + " created");
// }

export const environment = new Environment();
// console.log(environment)

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


app.use(express.static(path.join(__dirname, 'public')));

// app.use(auth);
app.use('/', indexRouter);

app.use('/api/pddl', pddlRouter);

app.use('/api/users', userRouter);

app.use('/api/domain-spec', domainSpecificationRouter);
app.use('/api/llm-spec', promptRouter);
app.use('/api/services', serviceRouter);

app.use('/api/user-study-participant-distribution', participantDistributerRouter);
app.use('/api/user-study', userStudyRouter);
app.use('/api/user-study-execution', userStudyExecutionRouter);

app.use('/api/demo', demoRouter);
app.use('/api/iteration-step', iterationStepRouter);
app.use('/api/plan', planRouter);

app.use('/api/plan-property', planPropertyRouter);

app.use('/uploads', express.static(uploads_folder));
app.use('/results', express.static(results_folder));
app.use('/images', express.static(images_folder));

app.use('/api/planner', plannerRouter);
app.use('/api/explainer', explainerRouter);
app.use('/api/run', iterationStepRouter);

app.use('/api/project', projectRouter);

app.use('/api/llm', LLMRouter);


// Beluga
app.use('/api/flight-plan-forest', flightPlanTreeRouter);
app.use('/api/flight-section-plan', flightSectionPlanRouter);
app.use('/api/flight-section-explanation', flightSectionExplanationRouter);

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
