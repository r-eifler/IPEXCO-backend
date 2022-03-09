import { Demo } from './../db_schema/demo';
import { PlanProperty } from '../db_schema/plan-properties/plan_property';

import path from 'path';
import { writeFileSync } from 'fs';
import * as child from 'child_process';
import { ExperimentSetting } from './experiment_setting';
import { PythonShell } from 'python-shell';
import { environment } from '../app';
import { json } from 'express';

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

    constructor(
        private root: string,
        private demo: Demo,
        private planProperties: PlanProperty[]) {
        this.runFolder = path.join(root, String(this.demo._id));

        this.create_experiment_setup();
    }

    create_experiment_setup(): void {

        child.execSync(`mkdir -p ${this.runFolder}/results`);
        child.execSync(`mkdir -p ${this.runFolder}/runs`);
        const domainFileName = path.basename(this.demo.domainFile.path);
        const problemFileName = path.basename(this.demo.problemFile.path);

        child.execSync(`cp ${path.join(environment.uploadsPath, domainFileName)} ${path.join(this.runFolder, 'domain.pddl')}`);
        child.execSync(`cp ${path.join(environment.uploadsPath, problemFileName)} ${path.join(this.runFolder, 'problem.pddl')}`);

        writeFileSync(path.join(this.runFolder, 'task-schema.json'),
            this.demo.baseTask.taskSchema(),
            'utf8');


        child.execSync(`cp -r ${environment.planner} ${this.runFolder}/fast-downward`);

        writeFileSync(path.join(this.runFolder, 'plan-properties.json'),
            JSON.stringify(this.generate_experiment_setting()),
            'utf8');

    }

    generate_experiment_setting(): ExperimentSetting {
        return {
            hard_goals: this.planProperties.filter(p => p.globalHardGoal).map(p => p.name),
            plan_properties: this.planProperties,
            soft_goals: []
        };
    }

    async executeRun(): Promise<string> {

        const addArgsDemo = [
            `${this.runFolder}/runs`,
            `${this.runFolder}/domain.pddl`,
            `${this.runFolder}/problem.pddl`,
            `${this.runFolder}/task-schema.json`,
            `${this.runFolder}/plan-properties.json`,
            `${this.runFolder}/results`
        ];

        const optionsDemo = {
            mode: 'text',
            pythonPath: '/usr/bin/python3',
            pythonOptions: ['-u'],
            scriptPath: environment.demoGenerator,
            args: addArgsDemo,
            env: { PLANNER: `${this.runFolder}/fast-downward/`, PROPERTYCHECKER: environment.propertyChecker, PATH: environment.path,
                SPOT_BIN_PATH: environment.spot, LTL2HAO_PATH: environment.ltltkit},
        };

        const addArgsDMaxUtility = [
            `${this.runFolder}/plan-properties.json`,
            `${this.runFolder}/results/demo.json`
        ];

        const optionsMaxUtility = {
            mode: 'text',
            pythonPath: '/usr/bin/python3',
            pythonOptions: ['-u'],
            scriptPath: environment.maxUtility,
            args: addArgsDMaxUtility,
            env: { PATH: environment.path},
        };

        return  new Promise<string>(
            async (resolve, reject) => {
                this.pythonShellCallDemo(optionsDemo).then((results1) => {
                        const resultsFolder = `${this.runFolder}/results/demo.json`;
                        writeFileSync(resultsFolder, results1.join('\n'), 'utf8');
                        this.copy_experiment_results();
                        this.demo.explanationHierarchy = `${environment.serverResultsPath}/demo_${this.demo._id}`;

                        // this.pythonShellCallMaxUtility(optionsMaxUtility).then((results2) => {
                        //     console.log(results2);
                        //     this.demo.maxUtility = JSON.parse(results2.join('\n'));
                        //         resolve(this.demo.maxUtility.value?.toString());
                        // },
                        // (err) => {
                        //     reject(err);
                        // });
                        // TODO
                    },
                    (err) => {
                        reject(err);
                    });
            });

    }

    pythonShellCallDemo(options: any): Promise<string[]> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            const shell: PythonShell = PythonShell.run('main.py', options, (err: any, results: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
            runningPythonShells.set(this.demo._id.toString(), shell);
        });
    }

    pythonShellCallMaxUtility(options: any): Promise<string[]> {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            const shell: PythonShell = PythonShell.run('main.py', options, (err: any, results: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
            runningPythonShells.set(this.demo._id.toString(), shell);
        });
    }

    copy_experiment_results(): void {
        child.execSync(`cp -r ${this.runFolder}/results/ ${environment.resultsPath}/demo_${this.demo._id}`);
    }

    tidyUp(): void {
        child.execSync(`rm -r ${this.runFolder}`);
        runningPythonShells.delete(this.demo._id);
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

        this.demo.explanationHierarchy = `${environment.serverResultsPath}/demo_${this.demo._id}`;
        // console.log(this.maxUtility);
        this.demo.maxUtility = JSON.parse(this.maxUtility);
    }


}
