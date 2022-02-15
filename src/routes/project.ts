import { ExecutionSettingsModel } from './../db_schema/execution_settings';
import { ExplanationRunModel, PlanRun, PlanRunModel } from './../db_schema/run';
import { PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { BaseProjectModel, Project } from './../db_schema/project';
import express from 'express';
import mongoose from 'mongoose';

import { ProjectModel } from '../db_schema/project';
import { TranslatorCall } from '../planner/general_planner';
import { deleteUploadFile } from '../planner/pddl_file_utils';
import { env } from 'process';
import { environment } from '../app';

export const projectRouter = express.Router();


async function computeAndStoreSchema(project: Project): Promise<Project | null> {
    try {
        const planner = new TranslatorCall(environment.experimentsRootPath, project);
        await planner.executeRun();

        await ProjectModel.updateOne({ _id: project._id},
            { $set: { taskSchema: project.taskSchema} });

        return await ProjectModel.findOne({ _id: project._id}).lean();
    } catch {
        await ProjectModel.deleteOne({ _id: project._id});
        return null;
    }
}


projectRouter.post('/', async (req: any, res) => {
    try {

        const settingsId = await (ExecutionSettingsModel as any).createProjectDefaultSettings();

        const projectModel = new ProjectModel({
            name: req.body.name,
            user: req.user._id,
            description: req.body.description,
            domainFile: req.body.domainFile,
            problemFile: req.body.problemFile,
            domainSpecification: req.body.domainSpecification,
            settings: settingsId
        });
        if (!projectModel) {
            return res.status(403).send('Create project failed.');
        }

        projectModel.save().then(async v => {

            // compute and store schema
            const project: Project = projectModel.toJSON() as Project;
            const resProject: Project | null = await computeAndStoreSchema(project);

            res.send({
                status: true,
                message: 'Project is stored',
                data: resProject
            });
        },
        reason => {
            console.log(reason);
        });

    } catch (ex) {
        res.send(ex.message);
    }
});


projectRouter.put('/:id', async (req, res) => {
    try {
        const refId = req.params.id;
        const project: Project | null = await BaseProjectModel.findOne({ _id: refId});
        if (!project) {
            return res.status(403).send('update project failed');
        }

        project.name = req.body.name;
        project.description = req.body.description;
        project.animationSettings = req.body.animationSettings;

        await project.save();

        res.send({
            status: true,
            message: 'Project is stored',
            data: project
        });

    } catch (ex) {
        res.send(ex.message);
    }
});


// projectRouter.post('/:id', async (req, res) => {
//     // TODO implement settings copy
//     try {
//         console.log('POST copy project id: ' + req.params.id);
//         const refId = mongoose.Types.ObjectId(req.params.id);
//         const refProject: Project | null = await ProjectModel.findOne({ _id: refId }).lean();
//         if (!refProject) { return res.status(404).send({ message: 'not found project' }); }

//         // console.log(refProject);
//         delete refProject._id; // reset the id to create a new Object
//         refProject.name = refProject.name + '(copy)';
//         const newProjectModel = new ProjectModel(refProject);
//         await newProjectModel.save();

//         // compute and store schema
//         const project: Project = newProjectModel.toJSON() as Project;
//         const resProject: Project | null = await computeAndStoreSchema(project);

//         // console.log(resProject);

//         res.send({
//             status: true,
//             message: 'Project is copied',
//             data: resProject
//         });

//     } catch (ex) {
//         res.send(ex.message);
//     }
// });

projectRouter.get('', async (req: any, res) => {
    const projects = await ProjectModel.find({ user: req.user._id});
    if (!projects) { return res.status(404).send({ message: 'No project found.' }); }
    res.send({
        data: projects
    });

});


projectRouter.get('/:id', async (req, res) => {
    const id = req.params.id;
    const project = await ProjectModel.findOne({ _id: id });
    if (!project) { return res.status(404).send({ message: 'No project found.' }); }
    res.send({
        data: project
    });

});

projectRouter.delete('/:id', async (req, res) => {
    const id = req.params.id;

    // delete project
    const projectDoc = await ProjectModel.findOne({ _id: id });
    if (!projectDoc) { return res.status(404).send({ message: 'No project found.' }); }

    const project: Project = projectDoc?.toJSON() as Project;

    // delete corresponding files
    //deleteUploadFile(project.domainFile.path);
    //deleteUploadFile(project.problemFile.path);
    //deleteUploadFile(project.domainSpecification.path);

    // Delete runs
    const planRunsDocs = await PlanRunModel.find({ projetc: id});

    for (const planRunDoc of planRunsDocs) {
        const planRun: PlanRun = planRunDoc.toJSON() as PlanRun;
        await ExplanationRunModel.deleteMany({planRun: planRun._id});
        await PlanRunModel.deleteOne({_id: planRun._id});
    }

    // delete properties
    const propertyDeleteResult = await PlanPropertyModel.deleteMany({ project: id});
    if (!propertyDeleteResult) { return res.status(404).send({ message: 'Problem during project deletion occurred' }); }

    await ExecutionSettingsModel.deleteOne({ _id: projectDoc.settings });

    // delete Project
    const projectDeleteResult = await ProjectModel.deleteOne({ _id: id });
    if (!projectDeleteResult) { return res.status(404).send({ message: 'No project found.' }); }

    res.send({
        data: projectDeleteResult
    });

});

