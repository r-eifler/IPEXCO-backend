import { BaseProjectModel, Project, ProjectMetaData} from './../db_schema/project';
import { IterationStep, IterationStepModel} from './../db_schema/iteration_step';
import { PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { auth } from '../middleware/auth';
import express from 'express';

import { ProjectModel } from '../db_schema/project';
import { PlanningTask } from '../db_schema/planning_task';
import { DemoModel } from '../db_schema/demo';

export const projectRouter = express.Router();



projectRouter.post('/', auth, async (req: any, res) => {
    let projectId = null;;
    try {
        const projectData: Project = req.body.data as Project;

        console.log('-------------------------------------------------')
        console.log(projectData.baseTask)
        console.log('-------------------------------------------------')

        projectData.user = req.user._id;
        projectData.domainSpecification = JSON.stringify(projectData.domainSpecification)
        projectData.baseTask.model = JSON.stringify(projectData.baseTask.model)
        delete projectData._id;

        console.log(projectData)

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
        project.domainSpecification = JSON.stringify(projectData.domainSpecification)

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
    const projects = await ProjectModel.find({ user: req.user._id});
    if (!projects) { 
        return res.status(404).send({ message: 'No project found.' });
    }
    res.send({
        data: projects
    });

});

projectRouter.get('/meta-data', auth, async (req: any, res) => {
    const projects = await ProjectModel.find({ user: req.user._id}) as Project[];
    if (!projects) { 
        return res.status(404).send({ message: 'No project found.' });
    }

    let metaDataList: ProjectMetaData[] = projects.map(project => ({
        _id: project._id,
        updated: project.updated,
        name: project.name,
        user: project.user,
        description: project.description
    }))

    res.send({
        data: metaDataList
    });

});



projectRouter.get('/:id', auth, async (req, res) => {
    try {
        const id = req.params.id;

        if (id == null || id == 'null') { 
            return res.status(404).send({ message: 'No project found.' });
        }

        const project = await ProjectModel.findOne({ _id: id });
        if (project) { 
            return res.send({
                data: project
            });
        }

        const demo = await DemoModel.findOne({ _id: id });
        if (demo) { 
            return res.send({
                data: demo
            });
        }

        return res.status(500).send({ message: 'No project found.' });

    } catch (ex : any) {
        console.log(ex);
        res.status(500).send();
    }
});

projectRouter.delete('/meta-data/:id', auth, async (req, res) => {
    const id = req.params.id;

    // // delete iteration steps
    // const iterationsDeleteResult = await IterationStepModel.deleteMany({ project: id});
    // if (!iterationsDeleteResult) { 
    //     return res.status(404).send({ message: 'Problem during project deletion occurred' }); 
    // }

    // // delete properties
    // const propertyDeleteResult = await PlanPropertyModel.deleteMany({ project: id});
    // if (!propertyDeleteResult) { 
    //     return res.status(404).send({ message: 'Problem during project deletion occurred' }); 
    // }

    // delete project itself
    const projectDeleteResult = await ProjectModel.deleteOne({ _id: id });
    if (!projectDeleteResult) { 
        return res.status(404).send({ message: 'No project found.' }); 
    }

    res.send({
        data: projectDeleteResult
    });

});

