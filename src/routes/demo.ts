import { Project, ProjectModel } from './../db_schema/project';
import { authForward } from './../middleware/auth';
import { RunStatus } from '../db_schema/iteration_step';
import { PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { Demo, DemoModel } from './../db_schema/demo';
import express from 'express';
import mongoose from 'mongoose';
import { cancelDemoComputation, DemoComputation, DemoPreComputation } from '../planner/demo-computation';
import { auth } from '../middleware/auth';

import multer from 'multer';
import path from 'path';
import { deleteResultFile, deleteUploadFile } from '../planner/pddl_file_utils';
import { User } from '../db_schema/user';
import { environment } from '../app';
import { PlanningTaskRelaxationSpaceModel } from '../db_schema/task_modification';

export const demoRouter = express.Router();

const imgPort = 'http://localhost:3000';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(path.resolve(__dirname, '..'), 'data/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    },
});

const fileFilter = (req: any, file: any, cb: (arg0: null, arg1: boolean) => void) => {
    cb(null, true);
    // if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
    //     cb(null, true);
    // } else {
    //     cb(null, false);
    // }
};

const upload = multer({
    storage,
    fileFilter
});

demoRouter.post('/', auth, upload.single('summaryImage'), async (req, res) => {

    let demo: Demo | null = null;
    try {

        const project = await ProjectModel.findById(req.body.projectId);

        if (!project) {
            return res.status(403).send('create demo failed');
        }

        let imageFilePath = null;
        if (req.file) {
            imageFilePath = '/uploads/' + req.file.filename;
        }

        demo = new DemoModel();
        demo.isNew = true;

        demo.user = project.user;
        demo.domainFile = project.domainFile;
        demo.domainSpecification = project.domainSpecification;
        demo.problemFile = project.problemFile;
        demo.description = project.description;
        demo.baseTask = project.baseTask;
        demo.settings = project.settings;
        demo.animationSettings = project.animationSettings;

        demo.name = req.body.name;
        demo.summaryImage = imageFilePath;
        demo.status = RunStatus.pending;
        demo.description = req.body.description;
        demo.taskInfo = req.body.taskInfo;
        demo.public = false;

        if (!demo || ! demo._id) {
            return res.status(403).send('create demo failed');
        }

        await demo.save();

        // copy plan-properties
        const planProperties = await PlanPropertyModel.find({ project: project?._id, isUsed: true });
        for (const pp of planProperties) {
            const newPP = new PlanPropertyModel(pp);
            delete newPP._id;
            newPP.project = demo._id;
            newPP.isNew = true;
            await newPP.save();
        }

    } catch (ex) {
        res.send(ex.message);
        return;
    }

    // Precompute Demo data
    try {
        const planProperties = await PlanPropertyModel.find({ project: demo._id});
        const taskRelaxations = await PlanningTaskRelaxationSpaceModel.find({ project: demo._id});
        // TODO extent demo computation with task relaxations

        demo.status = RunStatus.running;
        await demo.save();

        const demoGen = new DemoComputation(environment.experimentsRootPath, demo, planProperties);

        demoGen.executeRun().then(
            async (maxUtility) => {
                if (!demo) {
                    return res.status(403).send('create demo failed');
                }
                demo.status = RunStatus.finished;
                await demo.save();
                demoGen.tidyUp();
            },
            async (err) => {
                console.log(err);
                await DemoModel.updateOne({ _id: demo?._id}, { $set: { status: RunStatus.failed } });
                demoGen.tidyUp();
            }
        );

        res.send({
            status: true,
            message: 'Demo created',
            data: demo
        });

    } catch (ex) {
        DemoModel.updateOne({ _id: demo?._id}, { $set: { status: RunStatus.failed } });
        res.send(ex.message);
    }
});



demoRouter.post('/precomputed', auth, upload.single('summaryImage'), async (req, res) => {


    let demo: Demo | null = null;
    try {

        const project = await ProjectModel.findById(req.body.projectId);

        if (!project) {
            return res.status(403).send('create demo failed');
        }

        let imageFilePath = null;
        if (req.file) {
            imageFilePath = '/uploads/' + req.file.filename;
        }


        demo = new DemoModel();
        demo.isNew = true;

        demo.user = project.user;
        demo.domainFile = project.domainFile;
        demo.domainSpecification = project.domainSpecification;
        demo.problemFile = project.problemFile;
        demo.description = project.description;
        demo.baseTask = project.baseTask;
        demo.settings = project.settings;
        demo.animationSettings = project.animationSettings;

        demo.name = req.body.name;
        demo.summaryImage = imageFilePath;
        demo.status = RunStatus.pending;
        demo.description = req.body.description;
        demo.taskInfo = req.body.taskInfo;
        demo.public = false;

        if (!demo || ! demo._id) {
            return res.status(403).send('create demo failed');
        }

        await demo.save();

        // copy plan-properties
        const planProperties = await PlanPropertyModel.find({ project: project?._id, isUsed: true });
        for (const pp of planProperties) {
            const newPP = new PlanPropertyModel(pp);
            delete newPP._id;
            newPP.project = demo._id;
            newPP.isNew = true;
            await newPP.save();
        }

    } catch (ex) {
        res.send(ex.message);
        return;
    }

    // Store precomputed Demo data
    try {

        demo.status = RunStatus.running;
        await demo.save();

        const demoData = req.body.demoData;
        const maxUtility = req.body.maxUtility;

        const demoGen = new DemoPreComputation(demo, demoData, maxUtility);
        demoGen.store();
        demo.status = RunStatus.finished;
        await demo.save();

        res.send({
            status: true,
            message: 'Demo created',
            data: demo
        });

    } catch (ex) {
        DemoModel.updateOne({ _id: demo?._id}, { $set: { status: RunStatus.failed } });
        res.send(ex.message);
    }
});


demoRouter.put('/', auth, async (req, res) => {

    try {
        const demo: Demo | null = await DemoModel.findById(req.body._id);

        if (!demo) {
            return res.status(403).send('Demo not found');
        }

        const demoData = req.body.data as Demo;

        demo.name = demoData.name;
        demo.description = demoData.description;
        demo.taskInfo = demoData.taskInfo;
        demo.settings = demoData.settings;

        await demo.save();

        res.send({
            status: true,
            message: 'Demo updated',
            data: demo
        });
    } catch (ex) {
        res.send(ex.message);
        return;
    }
});

demoRouter.post('/cancel/:id', auth, async (req, res) => {

    const demo = await DemoModel.findOne({ _id: req.params.id });

    if (!demo || ! demo._id) {
        return res.status(404).send({ message: 'not found demo' });
    }

    cancelDemoComputation(demo._id.toString()). then(
        async (canceled) => {
            await DemoModel.deleteOne({ _id: req.params.id });
            res.send({
                successful: canceled,
                data: demo
    });
        },
        (error) => {
            res.send({
                successful: false,
                data: demo
            });
        });
});


demoRouter.get('', authForward, async (req: any, res) => {

    try {
        const allDemos: Demo[] = await DemoModel.find();

        const demos = allDemos.filter(
            d => {
                d.public || 
                (req.user && 
                    (d.user as any)._id.toHexString() === req.user._id.toHexString());
        });

        if (!demos) { 
            return res.status(404).send({ message: 'No demos found' });
        }

        res.send({
            data: demos
        });

    } catch (ex) {
        res.send(ex.message);
    }
});

demoRouter.get('/:id', authForward, async (req, res) => {
    const demo = await DemoModel.findOne({ _id: req.params.id });

    if (!demo) 
        { return res.status(404).send({ message: 'Demo not found.' }); 
    }

    res.send({
        data: demo
    });

});

demoRouter.delete('/:id', auth, async (req, res) => {
    const id = req.params.id;

    const demo: Demo | null = await DemoModel.findById(id);
    if (!demo) { return res.status(404).send({ message: 'Demo not found.' }); }

    if (demo.summaryImage) {
        deleteUploadFile(demo.summaryImage);
    }

    deleteResultFile('demo_' + demo._id);

    // delete properties
    const propertyDeleteResult = await PlanPropertyModel.deleteMany({ project: id});
    if (!propertyDeleteResult) { 
        return res.status(404).send({ message: 'Problem during demo deletion occurred' });
    }

    const result = await DemoModel.deleteOne({ _id: id });
    if (!result) { 
        return res.status(404).send({ message: 'Demo deletion failed.' });
    }

    res.send({
        data: result
    });

});
