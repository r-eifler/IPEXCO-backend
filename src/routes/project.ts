import { IterationStep, IterationStepModel, DepExplanationRun } from './../db_schema/iteration_step';
import {PlanRunModel, DepExplanationRunModel, RelaxationExplanationRunModel} from '../db_schema/iteration_step';
import { PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { BaseProjectModel, Project } from './../db_schema/project';
import express from 'express';

import { ProjectModel } from '../db_schema/project';
import { TranslatorCall } from '../planner/general_planner';
import { environment } from '../app';
import { deleteIterationStep } from './utils';

export const projectRouter = express.Router();


async function computeAndStoreSchema(project: Project): Promise<Project | null> {
    try {
        const planner = new TranslatorCall(environment.experimentsRootPath, project);
        await planner.executeRun();

        await ProjectModel.updateOne({ _id: project._id},
            { $set: { baseTask: project.baseTask} });

        return await ProjectModel.findOne({ _id: project._id}).lean();
    } catch {
        await ProjectModel.deleteOne({ _id: project._id});
        return null;
    }
}


projectRouter.post('/', async (req: any, res) => {
    try {
        const projectData: Project = req.body.data as Project;
        projectData.user = req.user._id;

        const projectModel = new ProjectModel(projectData);

        if (!projectModel) {
            return res.status(403).send('Create project failed.');
        }

        projectModel.save().then(async project => {

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

        const projectData: Project = req.body.project as Project;

        project.name = projectData.name;
        project.description = projectData.description;
        project.animationSettings = projectData.animationSettings;

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


projectRouter.get('', async (req: any, res) => {
    const projects = await ProjectModel.find({ user: req.user._id});
    if (!projects) { 
        return res.status(404).send({ message: 'No project found.' });
    }
    res.send({
        data: projects
    });

});


projectRouter.get('/:id', async (req, res) => {
    const id = req.params.id;
    const project = await ProjectModel.findOne({ _id: id });
    if (!project) { 
        return res.status(404).send({ message: 'No project found.' });
    }
    res.send({
        data: project
    });

});

projectRouter.delete('/:id', async (req, res) => {
    const id = req.params.id;

    // delete project
    const project = await ProjectModel.findOne({ _id: id });
    if (!project) { 
        return res.status(404).send({ message: 'No project found.' });
    }

    // Delete iterations 
    const iterations: IterationStep[] = await IterationStepModel.find({ projetc: id});
    const planRunsDocs = await PlanRunModel.find({ projetc: id});

    for (const step of iterations) {
        deleteIterationStep(step)
    }

    // delete properties
    const propertyDeleteResult = await PlanPropertyModel.deleteMany({ project: id});
    if (!propertyDeleteResult) { 
        return res.status(404).send({ message: 'Problem during project deletion occurred' }); 
    }

    // delete Project
    const projectDeleteResult = await ProjectModel.deleteOne({ _id: id });
    if (!projectDeleteResult) { 
        return res.status(404).send({ message: 'No project found.' }); 
    }

    res.send({
        data: projectDeleteResult
    });

});

