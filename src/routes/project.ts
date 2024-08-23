import { BaseProjectModel, Project } from './../db_schema/project';
import { IterationStep, IterationStepModel} from './../db_schema/iteration_step';
import { PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { auth } from '../middleware/auth';
import express from 'express';

import { ProjectModel } from '../db_schema/project';

export const projectRouter = express.Router();



projectRouter.post('/', auth, async (req: any, res) => {
    let projectId = null;;
    try {
        const projectData: Project = req.body.data as Project;
        projectData.user = req.user._id;
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
        
        res.send({
            status: true,
            message: 'Project created',
            data: newProject
        });

    } catch (ex : any) {
        console.log(ex.message);
        if(projectId){
            await ProjectModel.deleteOne({ _id: projectId });
        }
        res.status(404).send(ex.message);
    }
});


projectRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;
        const project: Project | null = await BaseProjectModel.findOne({ _id: refId});

        if (!project) {
            return res.status(404).send('update project failed');
        }

        const projectData: Project = req.body.data as Project;

        project.name = projectData.name;
        project.description = projectData.description;
        project.settings = projectData.settings;
        project.public = projectData.public;

        await project.save();

        res.send({
            status: true,
            message: 'Project is stored',
            data: project
        });

    } catch (ex : any) {
        res.send(ex.message);
    }
});


projectRouter.get('', auth, async (req: any, res) => {
    const projects = await ProjectModel.find({ user: req.user._id}).populate('baseTask');
    if (!projects) { 
        return res.status(404).send({ message: 'No project found.' });
    }
    res.send({
        data: projects
    });

});


projectRouter.get('/:id', auth, async (req, res) => {
    const id = req.params.id;
    console.log("Get project: " + id)
    const project = await ProjectModel.findOne({ _id: id }).populate('baseTask');;
    if (!project) { 
        return res.status(404).send({ message: 'No project found.' });
    }

    res.send({
        data: project
    });

});

projectRouter.delete('/:id', auth, async (req, res) => {
    const id = req.params.id;

    // delete iteration steps
    const iterationsDeleteResult = await IterationStepModel.deleteMany({ project: id});
    if (!iterationsDeleteResult) { 
        return res.status(404).send({ message: 'Problem during project deletion occurred' }); 
    }

    // delete properties
    const propertyDeleteResult = await PlanPropertyModel.deleteMany({ project: id});
    if (!propertyDeleteResult) { 
        return res.status(404).send({ message: 'Problem during project deletion occurred' }); 
    }

    // delete project itself
    const projectDeleteResult = await ProjectModel.deleteOne({ _id: id });
    if (!projectDeleteResult) { 
        return res.status(404).send({ message: 'No project found.' }); 
    }

    res.send({
        data: projectDeleteResult
    });

});

