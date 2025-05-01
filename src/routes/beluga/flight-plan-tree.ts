import express from 'express';
import { object, string } from 'zod';
import { FlightPlanTree, FlightPlanTreeBaseZ, FlightPlanTreeModel, FlightPlanTreeZ, FlightSection, FlightSectionBaseZ, FlightSectionModel, FlightSectionZ } from '../../db_schema/beluga/flight-section-tree';
import { authAny } from '../../middleware/auth';
import { PlanRunStatus } from '../../db_schema/iteration_step';


export const flightPlanTreeRouter = express.Router();


flightPlanTreeRouter.post('', authAny, async (req: any, res) => {
    try {
        const data = FlightPlanTreeBaseZ.parse(req.body);

        const dataWithUser  = {
            ...data,
            user: req.user._id,
        }

        const tree = new FlightPlanTreeModel(dataWithUser);
        if (!tree) {
            res.status(500).send('forest not created');
            return;
        }
       tree.save();

        res.send(tree);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

flightPlanTreeRouter.post('/init', authAny, async (req: any, res) => {
    try {
        const idObject = object({projectId: string()}).parse(req.body);

        const treeData = {
            user: req.user._id,
            branches: [{
                name: 'main',
                sectionIdHead: null
            }],
            selectedBranch: 0,
            selectedSectionId: null,
            project: idObject.projectId
        }

        const tree = new FlightPlanTreeModel(treeData);
        if (!tree) {
            res.status(500).send('tree not created');
            return;
        }
        await tree.save();

        const sectionData  = {
            user: req.user._id,
            status: PlanRunStatus.PENDING,
            actions: [],
            flightIndex: 0,
            finished: false,
            predecessorId: null,
            treeId: tree._id
        }

        const section = new FlightSectionModel(sectionData);
        if (!section) {
            res.status(500).send('tree not created');
            return;
        }
        await section.save();

        tree.selectedSectionId = section._id;
        tree.branches[0].sectionIdHead = section._id;

        tree.save();

        res.send(tree);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

flightPlanTreeRouter.post('/section', authAny, async (req: any, res) => {
    try {
        const data = FlightSectionBaseZ.parse(req.body);

        const dataWithUser  = {
            ...data,
            user: req.user._id,
        }

        const section = new FlightSectionModel(dataWithUser);
        if (!section) {
            res.status(500).send('forest not created');
            return;
        }
        section.save();

        res.send(section);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


flightPlanTreeRouter.put('/:id', authAny, async (req, res) => {
    try {
        const refId = req.params.id;
        const data = FlightPlanTreeZ.parse(req.body);

        await FlightPlanTreeModel.replaceOne({ _id: refId}, data);

        const forest: FlightPlanTree | null = await FlightPlanTreeModel.findOne({ _id: refId}).lean();

        if (!forest) {
            res.status(403).send('update forest failed');
            return;
        }

        res.send(forest);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

flightPlanTreeRouter.put('/section/:id', authAny, async (req, res) => {
    try {
        const refId = req.params.id;
        const data = FlightSectionZ.parse(req.body);

        await FlightPlanTreeModel.replaceOne({ _id: refId}, data);

        const section: FlightSection | null = await FlightSectionModel.findOne({ _id: refId}).lean();

        if (!section) {
            res.status(403).send('update forest failed');
            return;
        }

        res.send(section);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


flightPlanTreeRouter.get('', authAny, async (req: any, res) => {
    try {
        const projectId: string = string().parse(req.query.projectId);
        const userId: string = req.user._id;
        const trees = await FlightPlanTreeModel.find({ project: projectId, user: userId})

        if (!trees || trees.length == 0) { 
            console.log("no tree");
            res.send(null);
            return;
        }

        const tree = trees[0];

        res.send(tree);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

flightPlanTreeRouter.get('/section', authAny, async (req: any, res) => {
    try {
        const treeId: string = string().parse(req.query.treeId);
        const userId: string = req.user._id;
        const sections = await FlightSectionModel.find({ treeId: treeId, user: userId})
        if (!sections) { 
            res.status(403).send('get sections failed');
            return;
        }

        res.send(sections);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});


flightPlanTreeRouter.delete('/:id', authAny, async (req, res) => {

    try{
        const result = await FlightPlanTreeModel.deleteOne({ _id: req.params.id});

        if (result.deletedCount !== 1) { 
            res.status(404).send({ message: 'No forest found.' });
            return;
        }

        res.send(true);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


flightPlanTreeRouter.delete('/section/:id', authAny, async (req, res) => {

    try{
        const result = await FlightSectionModel.deleteOne({ _id: req.params.id});

        if (result.deletedCount !== 1) { 
            res.status(404).send({ message: 'No section found.' });
            return;
        }

        res.send(true);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


