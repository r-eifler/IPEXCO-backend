import express from 'express';
import { auth, authAny, AuthenticatedRequest } from '../middleware/auth';
import { BaseProjectModel, Project, ProjectBase, ProjectBaseZ, ProjectMetaData, ProjectZ } from './../db_schema/project';

import { DemoModel } from '../db_schema/demo';
import { IterationStepModel } from '../db_schema/iteration_step';
import { PlanPropertyModel } from '../db_schema/plan-properties/plan_property';
import { ProjectModel } from '../db_schema/project';

export const projectRouter = express.Router();



projectRouter.post('/', auth, async (req: AuthenticatedRequest, res) => {
    let projectId = null;;
    try {
        const projectBaseData: ProjectBase = ProjectBaseZ.parse(req.body);

        if (!req.user) {
            res.status(401).send('Create project failed.');
            return;
        }

        const projectData : ProjectBase & {user: string} = {
            ...projectBaseData,
            user: req.user._id
        }

        const projectModel = new ProjectModel(projectData);

        if (!projectModel) {
            res.status(404).send('Create project failed.');
            return;
        }

        let newProject: Project | null = await projectModel.save();

        if (!newProject) {
            res.status(404).send('Create project failed.');
            return;
        }
        projectId = newProject._id;
        
        res.send(newProject);

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
        const project = await BaseProjectModel.findOne({ _id: refId});

        if (!project) {
            res.status(404).send('update project failed');
            return;
        }

        const projectData = ProjectZ.parse(req.body);

        project.name = projectData.name;
        project.description = projectData.description;
        project.settings = projectData.settings;
        project.public = projectData.public;

        await project.save();

        res.send(project);

    } catch (ex : any) {
        res.send(ex.message);
    }
});


projectRouter.get('', auth, async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        res.status(401);
        return;
    }
    const projects: Project[] = await ProjectModel.find({ user: req.user._id});
    if (!projects) { 
        res.status(404).send({ message: 'No project found.' });
        return;
    }

    res.send(projects);

});

projectRouter.get('/user-study', auth, async (req: AuthenticatedRequest, res) => {
    try {
        let user = req.user;
        if (!user) {
            res.status(401);
            return;
        }
        const allProjects: Project[] = await ProjectModel.find();

        const projects = allProjects.filter(
            p => p.public || (req.user && p.user.toString() == user._id.toString())
        );

        if (!projects) { 
            res.status(404).send({ message: 'No projects found' });
            return;
        }

        res.send(projects);
    } catch (ex) {
        console.log(ex)
        res.status(500);
    }

});

projectRouter.get('/meta-data', auth, async (req: any, res) => {
    if (!req.user) {
        res.status(401).send('Create project failed.');
        return;
    }
    const projects = await ProjectModel.find({ user: req.user._id}) as Project[];
    if (!projects) { 
        res.status(404).send({ message: 'No project found.' });
        return;
    }

    let metaDataList: ProjectMetaData[] = projects.filter(p => p._id !== undefined).
        map(project => ({
                _id: project._id,
                public: project.public,
                name: project.name,
                user: project.user.toString(),
            })
        )   

    res.send(metaDataList);

});



projectRouter.get('/:id', authAny, async (req: AuthenticatedRequest, res) => {
    try {

        if (!req.user) {
            res.status(401).send();
            return;
        }

        const id = req.params.id;

        if (id == null || id == 'null') { 
            res.status(404).send({ message: 'No project found.' });
            return;
        }

        const project = await ProjectModel.findOne({ _id: id });

        if (project) { 

            if(project.settings.main.public || req.user.role != 'user-study'){
                res.send(project);
            }
            else{
                res.status(401).send();
            }
            return;
        }

        const demo = await DemoModel.findOne({ _id: id });
        if (demo) { 
            res.send(demo)
            return;
        }

        res.status(500).send({ message: 'No project found.' });
        return;

    } catch (ex : any) {
        console.log(ex);
        res.status(500).send();
    }
});

projectRouter.delete('/meta-data/:id', auth, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            res.status(401).send();
            return;
        }

        const id = req.params.id;

        // // delete iteration steps
        const iterationsDeleteResult = await IterationStepModel.deleteMany({ project: id});
        if (!iterationsDeleteResult) { 
            res.status(404).send({ message: 'Problem during project deletion occurred' });
            return; 
        }

        // // delete properties
        const propertyDeleteResult = await PlanPropertyModel.deleteMany({ project: id});
        if (!propertyDeleteResult) { 
            res.status(404).send({ message: 'Problem during project deletion occurred' });
            return; 
        }

        // delete project itself
        const projectDeleteResult = await ProjectModel.deleteOne({ _id: id, user: req.user._id });
        if (!projectDeleteResult) { 
            res.status(404).send({ message: 'No project found.' });
            return; 
        }

        res.send(true);

    } catch (ex : any) {
        console.log(ex);
        res.status(500).send();
    }

});
