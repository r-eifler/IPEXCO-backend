import { PlanningTaskModel } from './../db_schema/planning_task';
import { BaseProjectModel, Project } from './../db_schema/project';
import { IterationStep, IterationStepModel} from './../db_schema/iteration_step';
import { PlanPropertyModel } from '../db_schema/plan-properties/plan_property';

import express from 'express';

import { ProjectModel } from '../db_schema/project';
import { TranslatorCall } from '../planner/general_planner';
import { environment } from '../app';
import { deleteIterationStep } from './utils';

export const projectRouter = express.Router();


async function computeAndStoreSchema(project: Project): Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            const planner = new TranslatorCall(environment.experimentsRootPath, project);
            const planningTask = await planner.executeRun();

            if(! planningTask){
                reject("task creation failed");
                return
            }

            let taskModel = new PlanningTaskModel(planningTask)
            await taskModel.save();

            project.baseTask = taskModel;
            await project.save();

            resolve('Task creation successful.');
        } catch (ex) {
            console.log(ex.message);
            reject('Task creation failed.');
        }
    });
}


projectRouter.post('/', async (req: any, res) => {
    let projectId = null;;
    try {
        const projectData: Project = req.body.data as Project;
        projectData.user = req.user._id;
        projectData.settings = projectData.settings;
        delete projectData._id;

        const projectModel = new ProjectModel(projectData);

        if (!projectModel) {
            return res.status(404).send('Create project failed.');
        }

        let newProject: Project | null = await projectModel.save();

        if (!newProject) {
            return res.status(404).send('Create project failed.');
        }
        projectId = newProject._id;

        await computeAndStoreSchema(newProject);
        
        res.send({
            status: true,
            message: 'Project created',
            data: newProject
        });

    } catch (ex) {
        console.log(ex.message);
        if(projectId){
            await ProjectModel.deleteOne({ _id: projectId });
        }
        res.status(404).send(ex.message);
    }
});


projectRouter.put('/:id', async (req, res) => {
    try {
        const refId = req.params.id;
        const project: Project | null = await BaseProjectModel.findOne({ _id: refId});

        if (!project) {
            return res.status(404).send('update project failed');
        }

        const projectData: Project = req.body.data as Project;

        project.name = projectData.name;
        project.description = projectData.description;
        project.animationSettings = projectData.animationSettings;
        project.settings = projectData.settings;
        project.public = projectData.public;

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
    const projects = await ProjectModel.find({ user: req.user._id}).populate('baseTask');
    if (!projects) { 
        return res.status(404).send({ message: 'No project found.' });
    }
    res.send({
        data: projects
    });

});


projectRouter.get('/:id', async (req, res) => {
    const id = req.params.id;
    const project = await ProjectModel.findOne({ _id: id }).populate('baseTask');;
    if (!project) { 
        return res.status(404).send({ message: 'No project found.' });
    }
    //project.settings = JSON.parse(project.settings);
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

