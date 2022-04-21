import { ModifiedPlanningTask } from './../db_schema/modified_planning_task';
import { PlanningTaskRelaxationSpace, FactUpdate, RelaxationDimension, computePossibleRelaxations } from './../db_schema/relaxations';
import { Demo } from './../db_schema/demo';
import { PlanProperty } from '../db_schema/plan-properties/plan_property';

import path from 'path';
import { writeFileSync } from 'fs';
import * as child from 'child_process';
import { ExperimentSetting } from './experiment_setting';
import { PythonShell } from 'python-shell';
import { environment } from '../app';
import { filterRelaxations, RelaxedTaskNode, toRelaxTaskDefinition } from './utils';
import { RelaxationExplanationRun, RunStatus } from '../db_schema/iteration_step';
import { RelaxExplanationDemoCall } from './general_planner';

const runningPythonShells = new Map<string, PythonShell>();

export function cancelDemoComputation(demoId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (!runningPythonShells.has(demoId)) {
            resolve(false);
            return;
        }
        runningPythonShells.get(demoId)?.end((err, exitCode, exitSignal) => {
            if (err) {
                reject(true);
                return;
            }
            if (exitCode === 0) {
                resolve(true);
                return;
            }
            if (exitCode === 1) {
                resolve(false);
                return;
            }
        });
    });
}



export class DemoComputation {

    runFolder: string;
    possibleRelaxations: FactUpdate[][];
    currentRelaxation: number =  0; 
    currentRelaxationSpace: number = 0;

    constructor(
        private root: string,
        private demo: Demo,
        private planProperties: PlanProperty[],
        private taskRelaxations: PlanningTaskRelaxationSpace[]) {

        console.log("------------------- DemoComputation ------------------------");
        this.runFolder = path.join(root, String(this.demo._id));
        this.possibleRelaxations = computePossibleRelaxations(this.taskRelaxations);
        console.log(this.possibleRelaxations);
        console.log("#possibleRelaxations: " + this.possibleRelaxations.length);
        console.log("#planProperties: " + this.planProperties.length);
    }

    hasNextRun(): boolean {
        return this.currentRelaxation < this.possibleRelaxations.length &&
            this.currentRelaxationSpace <  this.taskRelaxations.length;
    }

    async executeNextRun(): Promise<boolean> {

        console.log("-------------------------------------------");
        console.log("#relaxation: " + this.currentRelaxation + " #space: " + this.currentRelaxationSpace);

        let initUpdates = this.possibleRelaxations[this.currentRelaxation];
        // console.log("------ Updates -------");
        // initUpdates.forEach(u => console.log(u.newFact.toString()));
        // console.log("-------------");
        let modTask = new ModifiedPlanningTask('', this.demo.baseTask, initUpdates);

        let relaxationSpace = this.taskRelaxations[this.currentRelaxationSpace];
        let relaxExpRun : RelaxationExplanationRun = {
            name: 'relax_exp', 
            status: RunStatus.running, 
            relaxationSpace: relaxationSpace,
        }

        const planner = new RelaxExplanationDemoCall(environment.experimentsRootPath,
            this.demo._id, modTask, this.planProperties, relaxExpRun, relaxationSpace.dimensions);

        this.demo.completion = ((this.currentRelaxation + 1) * (this.currentRelaxationSpace + 1)) /
            this.possibleRelaxations.length * this.taskRelaxations.length;

        return new Promise<boolean>(async (resolve,rejects) => {
            let callResult = await planner.executeRun();
            if(callResult.error == 0){
                this.currentRelaxationSpace = (this.currentRelaxationSpace + 1) % this.taskRelaxations.length;
                if (this.currentRelaxationSpace  == 0) {
                    this.demo.explanations.push({initUpdates, relaxationExplanations: [relaxExpRun]})
                    this.currentRelaxation++;
                }
                else{
                    this.demo.explanations[this.demo.explanations.length - 1].relaxationExplanations.push(relaxExpRun);
                }
            }
            
            resolve(callResult.error == 0);
            return;
        });

    }

}



export class DemoPreComputation {

    constructor(
        private demo: Demo,
        private data: string,
        private maxUtility: string) {
    }

    store() {
        child.execSync(`mkdir  ${environment.resultsPath}/demo_${this.demo._id}`);
        writeFileSync(`${environment.resultsPath}/demo_${this.demo._id}/demo.json`, this.data, 'utf8');

        // this.demo.explanationHierarchy = `${environment.serverResultsPath}/demo_${this.demo._id}`;
        // console.log(this.maxUtility);
        this.demo.maxUtility = JSON.parse(this.maxUtility);
    }


}