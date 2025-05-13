import express from 'express';
import { array, object, string } from 'zod';
import { FlightPlanTree, FlightPlanTreeBaseZ, FlightPlanTreeModel, FlightPlanTreeZ, FlightSection, FlightSectionBase, FlightSectionBaseZ, FlightSectionModel, FlightSectionZ, FlightTargetScheduleZ, ProductionLineTargetScheduleZ } from '../../db_schema/beluga/flight-section-tree';
import { PlanRunStatus } from '../../db_schema/iteration_step';
import { authAny } from '../../middleware/auth';
import { BelugaSiteSetUpZ, BelugaSiteStateZ } from '../../db_schema/beluga/site_set_up';


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
        console.log('Init Tree')
        const initData = object({
            projectId: string(), 
            siteState: BelugaSiteStateZ,
            siteSetUp: BelugaSiteSetUpZ,
            flightTargetSchedule: FlightTargetScheduleZ,
            productionLinesTargetSchedule: array(ProductionLineTargetScheduleZ),
        }).parse(req.body);

        const treeData = {
            user: req.user._id,
            branches: [{
                name: 'main',
                sectionIdHead: null
            }],
            selectedBranch: 0,
            selectedSectionId: null,
            project: initData.projectId
        }

        const tree = new FlightPlanTreeModel(treeData);
        if (!tree) {
            res.status(500).send('tree not created');
            return;
        }
        await tree.save();

        const sectionData = {
            user: req.user._id,
            status: PlanRunStatus.PENDING,
            actions: [],
            flightIndex: 0,
            predecessorId: null,
            treeId: tree._id,
            siteState: initData.siteState,
            siteSetUp: initData.siteSetUp,

            incomingUnloaded: [],
            outgoingLoaded: [],
            productionLinesDelivered: initData.productionLinesTargetSchedule.reduce((acc,c) =>
                ({...acc, [c.name]: []}),  
                {}
            ),

            flightTargetSchedule: initData.flightTargetSchedule,
            productionLinesTargetSchedule: initData.productionLinesTargetSchedule,
            maxSwaps: 0,
            minEmptyRacks: 0,

            finished: false,
        }

        // console.log(sectionData);

        const section = new FlightSectionModel(sectionData);
        if (!section || section._id == null) {
            tree.deleteOne();
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


flightPlanTreeRouter.post('/branch', authAny, async (req: any, res) => {
    try {
        const idObject = object({sectionId: string(), branchName: string()}).parse(req.body);

        const section = await FlightSectionModel.findOne({ _id: idObject.sectionId});
    
        if (!section) {
            res.status(500).send('section does not exist');
            return;
        }

        const tree = await FlightPlanTreeModel.findOne({ _id: section.treeId});

        if (!tree) {
            res.status(500).send('tree does not exist');
            return;
        }

        const sectionData  = {
            user: req.user._id,
            status: PlanRunStatus.PENDING,
            actions: [],
            flightIndex: section.flightIndex,
            predecessorId: section.predecessorId,
            treeId: tree._id,
            siteState: section.siteState,
            siteSetUp: section.siteSetUp,

            incomingUnloaded: [],
            outgoingLoaded: [],
            productionLinesDelivered: section.productionLinesTargetSchedule.reduce((acc,c) =>
                ({...acc, [c.name]: []}),  
                {}
            ),

            flightTargetSchedule: section.flightTargetSchedule,
            productionLinesTargetSchedule: section.productionLinesTargetSchedule,
            maxSwaps: section.maxSwaps,
            minEmptyRacks: section.minEmptyRacks,

            finished: false,
        }

        const newSection = new FlightSectionModel(sectionData);
        if (!newSection) {
            res.status(500).send('new section not created');
            return;
        }
        await newSection.save();

        tree.selectedSectionId = newSection._id;
        tree.selectedBranch = tree.branches.length;
        tree.branches = [...tree.branches, {
            name: idObject.branchName,
            sectionIdHead: newSection._id
        }];

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
            res.status(500).send('section not created');
            return;
        }
        await section.save();

        const tree = await FlightPlanTreeModel.findById(section.treeId);
        if (!tree) {
            res.status(500).send('section not created');
            return;
        }

        const branchIndex = tree.selectedBranch; //branches.findIndex(b => b.sectionIdHead == section.predecessorId);

        tree.branches = [
            ...tree.branches.slice(0,branchIndex),
            {
                ...tree.branches[branchIndex],
                sectionIdHead: section._id,
            },
            ...tree.branches.slice(branchIndex + 1),
        ]
        tree.selectedSectionId = section._id;

        tree.save()


        res.send(section);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


flightPlanTreeRouter.put('/section/:id', authAny, async (req, res) => {
    try {
        const refId = req.params.id;
        const data = FlightSectionZ.parse(req.body);

        await FlightSectionModel.replaceOne({ _id: refId}, data);

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

flightPlanTreeRouter.get('/section/:id', authAny, async (req: any, res) => {
    try {
        const refId = req.params.id;
        const section = await FlightSectionModel.findById(refId);
        if (!section) { 
            res.status(403).send('get section failed');
            return;
        }

        res.send(section);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});


flightPlanTreeRouter.get('/:id', authAny, async (req: any, res) => {
    try {
        const refId = req.params.id;
        const tree = await FlightPlanTreeModel.findById(refId);

        if (!tree) { 
            console.log("no tree");
            res.send(null);
            return;
        }

        res.send(tree);

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


