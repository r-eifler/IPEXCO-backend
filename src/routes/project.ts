import { BaseProjectModel, Project, ProjectMetaData} from './../db_schema/project';
import { auth, authAny, AuthenticatedRequest } from '../middleware/auth';
import express from 'express';

import { ProjectModel } from '../db_schema/project';
import { DemoModel } from '../db_schema/demo';
import { defaultGeneralSetting } from '../db_schema/settings';

export const projectRouter = express.Router();



projectRouter.post('/', auth, async (req: AuthenticatedRequest, res) => {
    let projectId = null;;
    try {
        const projectData: Project = req.body.data as Project;

        if (!req.user) {
            return res.status(401).send('Create project failed.');
        }

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
        res.status(500).send();
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


projectRouter.get('', auth, async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        return res.status(401);
    }
    const projects: Project[] = await ProjectModel.find({ user: req.user._id});
    if (!projects) { 
        return res.status(404).send({ message: 'No project found.' });
    }

    res.send({
        data: projects
    });

});

projectRouter.get('/meta-data', auth, async (req: any, res) => {
    if (!req.user) {
        return res.status(401).send('Create project failed.');
    }
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



projectRouter.get('/:id', authAny, async (req: AuthenticatedRequest, res) => {
    try {

        if (!req.user) {
            return res.status(401).send();
        }

        const id = req.params.id;

        if (id == null || id == 'null') { 
            return res.status(404).send({ message: 'No project found.' });
        }

        const project = await ProjectModel.findOne({ _id: id });
        if (project) { 

            if(req.user.role != 'user-study'){
                return res.send({
                    data: project
                });
            }
            else{
                return res.status(401).send()
            }
            
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

projectRouter.delete('/meta-data/:id', auth, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).send();
        }

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
        const projectDeleteResult = await ProjectModel.deleteOne({ _id: id, user: req.user._id });
        if (!projectDeleteResult) { 
            return res.status(404).send({ message: 'No project found.' }); 
        }

        res.send({
            data: projectDeleteResult
        });
    } catch (ex : any) {
        console.log(ex);
        res.status(500).send();
    }

});

