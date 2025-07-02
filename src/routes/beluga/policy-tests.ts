import express from 'express';
import { number, object, string } from 'zod';
import { TestCase, TestCollectionModel, TestRunStatus, TestStateGenerationMethod, TestSuiteBaseZ } from '../../db_schema/beluga/test-case';
import { authAny, authService } from '../../middleware/auth';
import path from 'path';
import multer from 'multer';
import { ProjectModel } from '../../db_schema/project';
import { Service, ServiceModel, ServiceType } from '../../db_schema/services';
import { InstanceTesterResponse, JSONInstanceTesterRequest, TesterRunStatus, TestResultResponse, TestStartResponse } from '../../db_schema/service_communication';
import { callServices } from '../../services/utils';
import { sleep } from 'openai/core';
import { FlightSectionModel, getTaskFromSection } from '../../db_schema/beluga/flight-section-tree';

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


policyTestsRouter.put('/:id/reset', authAny, async (req: any, res) => {
    try {
        const testSuiteId: string = req.params.id

        const testSuite = await TestCollectionModel.findById(testSuiteId)

        if (!testSuite) {
            res.status(500).send('no test suite found');
            return;
        }

        testSuite.testCases = [];
        testSuite.numFuzzStates = 0;
        testSuite.status = TestRunStatus.PENDING;
        await testSuite.save();

        res.send(testSuite);
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

        let flightSection = await FlightSectionModel.findById(testSuite.flightSection);
        if (!flightSection) {
            res.status(500).send('flight section not found');
            return;
        } 

        const task = getTaskFromSection(flightSection);

        const baseURL = process.env.BASE_URL || 'http://host.docker.internal:3000'
        let payload: JSONInstanceTesterRequest = {
            id: testSuite._id,
            test_start_callback: baseURL + '/api/policy-testing/start/' + testSuite._id,
            test_result_callback: baseURL + '/api/policy-testing/result/' + testSuite._id,
            final_callback: baseURL + '/api/policy-testing/finished/' + testSuite._id,
            problem: task,
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
        // console.log("-------- body ------")
        // console.log(req.body);
        // console.log("-------- body ------")

        const data: TestStartResponse = req.body;

        const testSuite = await TestCollectionModel.findById(testSuiteId)

        if (!testSuite) {
            res.status(500).send('no test suite found');
            return;
        }

        console.log("Start test state: " + data.state_id)

        const testCaseIndex = testSuite.testCases.findIndex(tc => tc.stateID == data.state_id && tc.status == TestRunStatus.RUNNING )

        if(testCaseIndex == -1){
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
        }
        else{
            // start processed after result
            console.log("Start handler: result processed before start" + data.state_id)
            console.log("Start handler index: " + testCaseIndex)
            const testCase = testSuite.testCases[testCaseIndex];
            testCase.state =  data.state_values;
            testCase.policyTrace = data.policy_trace;
            testCase.policyCost = data.policy_cost 
        }

        // console.log(testSuite.testCases);

        await testSuite.save()

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

        let testSuite = await TestCollectionModel.findById(testSuiteId)

        if (!testSuite) {
            res.status(500).send('no test suite found');
            return;
        }


        TestCollectionModel

        console.log("Result test state: " + data.state_id)

        let testCaseIndex = testSuite.testCases.findIndex(tc => tc.stateID == data.state_id && tc.status == TestRunStatus.RUNNING)

        if(testCaseIndex == -1){
            await sleep(500)
            testSuite = await TestCollectionModel.findById(testSuiteId)

            if (!testSuite) {
                console.log("no test suite found")
                return;
            }

            testCaseIndex = testSuite.testCases.findIndex(tc => tc.stateID == data.state_id)

            if (testCaseIndex == -1) {
                console.log("Start still not received")
                return;
            }
        }

        console.log("Result handler Index: " + testCaseIndex)
        const testCase = testSuite.testCases[testCaseIndex];
        testCase.classifiedAdBug = data.is_bug;
        testCase.status = TestRunStatus.FINISHED;

        await testSuite.save()
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

        testSuite.numFuzzStates = testSuite?.testCases.length;
        testSuite.testCases.map((tc) => ({
            ...tc,
            status: tc.status == TestRunStatus.RUNNING ?  TestRunStatus.FAILED  : tc.status
        }));

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
        const data = TestSuiteBaseZ.parse(req.body);
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



