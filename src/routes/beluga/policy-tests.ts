import express from 'express';
import { number, object, string } from 'zod';
import { TestCase, TestCollectionBaseZ, TestCollectionModel, TestRunStatus, TestStateGenerationMethod } from '../../db_schema/beluga/test-case';
import { authAny, authService } from '../../middleware/auth';
import path from 'path';
import multer from 'multer';
import { ProjectModel } from '../../db_schema/project';
import { Service, ServiceModel, ServiceType } from '../../db_schema/services';
import { InstanceTesterResponse, JSONInstanceTesterRequest, TesterRunStatus, TestResultResponse, TestStartResponse } from '../../db_schema/service_communication';
import { callServices } from '../../services/utils';

export const upload = multer({dest: path.join(__dirname, '../../data/uploads')})

export const policyTestsRouter = express.Router();


policyTestsRouter.post('/upload/policy', authAny, upload.single('policy'), async (req: any, res) => {
    try {
        res.send(req.file);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});



policyTestsRouter.post('/:id/start-fuzzing', authAny, async (req: any, res) => {
    try {
        const testSuiteId: string = req.params.id
        const {numberOfFuzzedStates} = object({numberOfFuzzedStates: number()}).parse(req.body);
        console.log("testSuiteId: " + testSuiteId)
        console.log("numberOfFuzzedStates: " + numberOfFuzzedStates)

        const testSuite = await TestCollectionModel.findById(testSuiteId)

        if (!testSuite) {
            res.status(500).send('no test suite found');
            return;
        }

        testSuite.numFuzzStates += numberOfFuzzedStates;
        testSuite.status = TestRunStatus.RUNNING;
        await testSuite.save();

        let project = await ProjectModel.findById(testSuite.project);
        if (!project) {
            testSuite.status = TestRunStatus.FAILED;
            testSuite.save()
            console.log('[Testing] Project does not exist.')
            res.status(401).send('Fuzzing could not be started.');
            return;
        }

        const services: Service[] = [];
        for(const serviceId of project.settings.services.services) {
            const service = await ServiceModel.findById(serviceId);
            if(service && service.type == ServiceType.TESTER){
                services.push(service);
            }
        }

        if (services.length === 0) {
            testSuite.status = TestRunStatus.FAILED;
            testSuite.save()
            console.log('No existing testing service selected.');
            res.status(200).send(false);
            return;
        }

        const baseURL = process.env.BASE_URL || 'http://host.docker.internal:3000'
        let payload: JSONInstanceTesterRequest = {
            id: testSuite._id,
            test_start_callback: baseURL + '/api/policy-testing/start/' + testSuite._id,
            test_result_callback: baseURL + '/api/policy-testing/result/' + testSuite._id,
            final_callback: baseURL + '/api/policy-testing/finished/' + testSuite._id,
            problem: project.baseTask.model,
            num_fuzz_states: numberOfFuzzedStates,
            modelName: testSuite.policy.modelFileName,
            modelURL: baseURL + "/" + testSuite.policy.modelFileName
        }

        // console.log(JSON.stringify(payload))

        const success = await callServices(services, JSON.stringify(payload), '/instance-test');
        if(!success){
            testSuite.status = TestRunStatus.RUNNING;
            await testSuite.save();
            console.log('[Section Explanation Computation] Selected planner service not reachable.');
            res.status(201).send({status: false, message:'No selected planner service reachable.'});
            return;
        }
        

        res.send(testSuite);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

policyTestsRouter.post('/start/:id', authService, async (req: any, res) => {
    try {
        const testSuiteId: string = req.params.id
        // console.log(req.body);

        const data: TestStartResponse = req.body;

        const testSuite = await TestCollectionModel.findById(testSuiteId)

        if (!testSuite) {
            res.status(500).send('no test suite found');
            return;
        }

        console.log(data.state_id)

        testSuite.testCases.push({
            status: TestRunStatus.RUNNING,
            stateID: data.state_id,
            testID: data.test_id,
            state: data.state_values,
            policyTrace: data.policy_trace,
            policyCost: data.policy_cost,
            classifiedAdBug: false,
            method: TestStateGenerationMethod.FUZZING
        })

        // console.log(testSuite.testCases);

        testSuite.save()

        res.send();
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

policyTestsRouter.post('/result/:id', authService, async (req: any, res) => {
    try {
        const testSuiteId: string = req.params.id
        console.log(req.body);

        const data: TestResultResponse = req.body;

        const testSuite = await TestCollectionModel.findById(testSuiteId)

        if (!testSuite) {
            res.status(500).send('no test suite found');
            return;
        }

        const testCaseIndex = testSuite.testCases.findIndex(tc => tc.stateID == data.state_id)
        console.log("Index: " + testCaseIndex)
        const testCase = testSuite.testCases[testCaseIndex];
        testCase.classifiedAdBug = data.is_bug;
        testCase.status = TestRunStatus.FINISHED;

        testSuite.save()

        res.send();
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

policyTestsRouter.post('/finished/:id', authService, async (req: any, res) => {
    try {
        const testSuiteId: string = req.params.id
        console.log(req.body);

        const data: InstanceTesterResponse = req.body;

        const testSuite = await TestCollectionModel.findById(testSuiteId)

        if (!testSuite) {
            res.status(500).send('no test suite found');
            return;
        }

        if(data.status === TesterRunStatus.COMPLETED){
            testSuite.status = TestRunStatus.FINISHED;
        }
        else{
            testSuite.status + TestRunStatus.FAILED
        }

        testSuite.save()

        res.send();
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


policyTestsRouter.post('', authAny, async (req: any, res) => {
    try {
        const data = TestCollectionBaseZ.parse(req.body);
        console.log(data);

        const testC = new TestCollectionModel(data);
        if (!testC) {
            res.status(500).send('test collection not created');
            return;
        }
       testC.save();

        res.send(testC);
    }
    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});

policyTestsRouter.get('/:id', authAny, async (req: any, res) => {
    try {
        const test = await TestCollectionModel.findById({ _id: req.params.id});

        if (!test) { 
            res.send(null);
            return;
        }

        res.send(test);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});


policyTestsRouter.get('', authAny, async (req: any, res) => {
    try {
        const projectId: string = string().parse(req.query.projectId);
        const tests = await TestCollectionModel.find({ project: projectId})

        if (!tests) { 
            res.send(null);
            return;
        }

        res.send(tests);

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

policyTestsRouter.delete('/:id', authAny, async (req, res) => {

    try{
        const result = await TestCollectionModel.deleteOne({ _id: req.params.id});

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



