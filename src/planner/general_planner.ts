import { Fact } from '../db_schema/base_planning_task';
import { IterationStep } from './../db_schema/iteration_step';
import { Project } from './../db_schema/project';
import 'process';
import path, { resolve } from 'path';
import * as child from 'child_process';
import 'fs';

import { DepExplanationRun, PlanRun } from '../db_schema/iteration_step';
import { PlanProperty } from '../db_schema/plan-properties/plan_property';
import { ExperimentSetting } from './experiment_setting';
import { readFileSync, writeFileSync } from 'fs';
import { CallResult, pythonShellCallFD, pythonShellCallSimple } from './python-call';
import { environment } from '../app';
import { domain } from 'process';
import { PlanningTask } from '../db_schema/planning_task';
import { rejects } from 'assert';


export class TranslatorCall{

    runFolder: string;

    constructor(
        protected root: string,
        private project: Project) {
        this.runFolder = path.join(root, String(this.project._id));

        this.create_experiment_setup();
    }

    create_experiment_setup(): void {

        child.execSync(`mkdir -p ${this.runFolder}`);
        const domainFileName = path.basename(this.project.domainFile.path);
        const problemFileName = path.basename(this.project.problemFile.path);

        child.execSync(`cp ${path.join(environment.uploadsPath, domainFileName)} ${path.join(this.runFolder, 'domain.pddl')}`);
        child.execSync(`cp ${path.join(environment.uploadsPath, problemFileName)} ${path.join(this.runFolder, 'problem.pddl')}`);

        // child.execSync(`cp -r ${environment.planner} ${this.runFolder}/fast-downward`);
        child.execSync(`ln -s ${environment.planner} ${this.runFolder}/fast-downward`);
    }

    async executeRun(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const addArgs = [this.runFolder, '--build', 'release64', '--translate' , `${this.runFolder}/domain.pddl`,
                `${this.runFolder}/problem.pddl`];

            const options = {
                mode: 'text',
                pythonPath: '/usr/bin/python3',
                pythonOptions: ['-u'],
                scriptPath: `${this.runFolder}/fast-downward/`,
                args: addArgs,
                env: { SPOT_BIN_PATH: environment.spot, LTL2HAO_PATH: environment.ltltkit},
            };

            const results = await pythonShellCallSimple('run_FD.py', options);
            if (! results){
                reject('Task computation failed');
                return;
            }

            writeFileSync(path.join(environment.resultsPath, `out_${this.project._id}.log`), results.join('\n'), 'utf8');

            if (this.copy_experiment_results()){
                // console.log("copy_experiment_results: succ");
                resolve("result copy successful");
                return;
            }
            // console.log("copy_experiment_results: fail")
            reject("result copy failed");
            return;
        });
    }

    copy_experiment_results(): boolean {
        child.spawnSync('cp', [path.join(this.runFolder, 'fdr.json'),
            path.join(environment.resultsPath, `task_schema_${this.project._id}.json`)]);

        let taskString = readFileSync(path.join(environment.resultsPath, `task_schema_${this.project._id}.json`), 'utf8');
        let jsontask = JSON.parse(taskString);
        jsontask.initial = jsontask.init;
        delete jsontask.init;
        let task = jsontask as PlanningTask;
        // console.log(task);
        if (task){
            console.log("Task created ...");
            this.project.baseTask = task;
            // console.log(this.project);
            // console.log(this.project.baseTask);
            return true;
        }
        return false;
    }

    tidyUp(): void {
        child.execSync(`rm -r ${this.runFolder}`);
    }
}



export class PlannerCall {

    runFolder: string;

    constructor(
        protected plannerSetting: string[],
        protected root: string,
        protected runId: string,
        protected task: PlanningTask,
        protected hardGoals: PlanProperty[],
        protected softGoals: PlanProperty[]) {
        this.runFolder = path.join(root, String(this.runId));

        this.create_experiment_setup();
    }

    create_experiment_setup(): void {

        child.execSync(`mkdir -p ${this.runFolder}`);

        const task_definition: string[] = this.task.toPDDL();

        writeFileSync(path.join(this.runFolder, 'domain.pddl'),
            task_definition[0],
            'utf8');

        writeFileSync(path.join(this.runFolder, 'problem.pddl'),
            task_definition[1],
            'utf8');

        writeFileSync(path.join(this.runFolder, 'exp_setting.json'),
            JSON.stringify(this.generate_experiment_setting()),
            'utf8');

        // child.execSync(`cp -r ${environment.planner} ${this.runFolder}/fast-downward`);
        child.execSync(`ln -s ${environment.planner} ${this.runFolder}/fast-downward`);
    }

    generate_experiment_setting(): ExperimentSetting {
        const hardGoals: string[] = this.hardGoals.map(p => p.name);
        const softGoals: string[] = this.softGoals.map(p => p.name);
        const properties: PlanProperty[] = this.hardGoals.concat(this.softGoals);

        return { hard_goals: hardGoals, plan_properties: properties, soft_goals: softGoals};
    }

    async executeRun(): Promise<boolean> {

        const addArgs = [this.runFolder,
            '--build', 'release64',
            '--overall-memory-limit', '400M',
            '--overall-time-limit', '1m',
            `${this.runFolder}/domain.pddl`,
            `${this.runFolder}/problem.pddl`,
            `${this.runFolder}/exp_setting.json`, ...this.plannerSetting];

        const options = {
            mode: 'text',
            pythonPath: '/usr/bin/python3',
            pythonOptions: ['-u'],
            scriptPath: `${this.runFolder}/fast-downward/`,
            args: addArgs,
            env: { SPOT_BIN_PATH: environment.spot, LTL2HAO_PATH: environment.ltltkit},
        };

        const plannerResults : CallResult = await pythonShellCallFD(options);

        if (plannerResults.planFound) {
            writeFileSync(path.join(environment.resultsPath, `out_${this.runId}.log`), plannerResults.log.join('\n'), 'utf8');
            this.copy_experiment_results();
        }

        return plannerResults.planFound;
    }

    copy_experiment_results(): void {
        // implement in subclass
    }

    tidyUp(): void {
        child.execSync(`rm -r ${this.runFolder}`);
    }
}



// const plannerSettingOptPlan = ['--search', 'astar(hmax())'];
const plannerSettingOptPlan = ['--search', 'astar(iPDB())'];
const plannerSettingSatPlan = ['--search', 'lazy_greedy([ff()], preferred=[ff()])'];
export class PlanCall extends PlannerCall{

    constructor(root: string, private step: IterationStep) {
        super(plannerSettingOptPlan, root, step._id, step.task.basetask, step.hardGoals, step.softGoals);
    }

    copy_experiment_results(): void {
        const buffer: Buffer = readFileSync(path.join(this.runFolder, 'sas_plan'));
        if (this.step.plan){
            this.step.plan.result = buffer.toString('utf8');
            this.step.plan.log = environment.serverResultsPath + `/out_${this.runId}.log`;
        }
    }
}



const plannerSettingMUGS = ['--heuristic', 'h=hc(nogoods=false, cache_estimates=false)', '--heuristic',
   'mugs_h=mugs_hc(hc=h, all_softgoals=false)', '--search', 'dfs(u_eval=mugs_h)'];
export class ExplanationCall extends PlannerCall{

    constructor(root: string, step: IterationStep, private depExpRun: DepExplanationRun) {
        super(plannerSettingMUGS, root, depExpRun._id, step.task.basetask, depExpRun.hardGoals, depExpRun.softGoals);
    }

    copy_experiment_results(): void {
        const buffer: Buffer = readFileSync(path.join(this.runFolder, 'mugs.json'));
        this.depExpRun.result = buffer.toString('utf8');

        this.depExpRun.log = environment.serverResultsPath + `/out_${this.runId}.log`;
    }
}



