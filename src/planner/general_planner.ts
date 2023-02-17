import { RelaxationDimension } from './../db_schema/relaxations';
import { ModifiedPlanningTask } from './../db_schema/modified_planning_task';
import { IterationStep, RelaxationExplanationRun } from './../db_schema/iteration_step';
import { Project } from './../db_schema/project';
import 'process';
import path, { resolve } from 'path';
import * as child from 'child_process';
import fs from 'fs';

import { DepExplanationRun } from '../db_schema/iteration_step';
import { PlanProperty } from '../db_schema/plan-properties/plan_property';
import { ExperimentSetting } from './experiment_setting';
import { readFileSync, writeFileSync } from 'fs';
import { CallResult, pythonShellCallFD, pythonShellCallSimple } from './python-call';
import { environment } from '../app';
import { PlanningTask } from '../db_schema/planning_task';
import { filterRelaxations, getAdditionalUpdates, RelaxedTaskNode, toConflicts, toRelaxTaskDefinition } from './utils';
import { FactUpdate } from '../db_schema/relaxations';
import { RelaxationExplanationNode } from '../db_schema/explanations';
import { rejects } from 'assert';
import { Demo } from '../db_schema/demo';


export class TranslatorCall{

    runFolder: string;

    constructor(
        protected root: string,
        private project: Project) {
        this.runFolder = path.join(root, String(this.project._id));

        this.create_experiment_setup();
    }

    create_experiment_setup(): void {

        child.execSync(`rm -rf ${this.runFolder}`);
        child.execSync(`mkdir -p ${this.runFolder}`);
        const domainFileName = path.basename(this.project.domainFile.path);
        const problemFileName = path.basename(this.project.problemFile.path);

        child.execSync(`cp ${path.join(environment.uploadsPath, domainFileName)} ${path.join(this.runFolder, 'domain.pddl')}`);
        child.execSync(`cp ${path.join(environment.uploadsPath, problemFileName)} ${path.join(this.runFolder, 'problem.pddl')}`);

        // child.execSync(`cp -r ${environment.planner} ${this.runFolder}/fast-downward`);
        child.execSync(`ln -s ${environment.planner} ${this.runFolder}/fast-downward`);
    }

    async executeRun(): Promise<PlanningTask> {
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

            let task = this.copy_experiment_results()
            this.tidyUp();

            if (task){
                resolve(task);
                return;
            }
            reject(task);
            return;
        });
    }

    copy_experiment_results(): PlanningTask | null {
        child.spawnSync('cp', [path.join(this.runFolder, 'fdr.json'),
            path.join(environment.resultsPath, `task_schema_${this.project._id}.json`)]);

        let taskString = readFileSync(path.join(environment.resultsPath, `task_schema_${this.project._id}.json`), 'utf8');
        let jsontask = JSON.parse(taskString);
        jsontask.initial = jsontask.init;
        delete jsontask.init;
        return new PlanningTask(jsontask);
    }

    tidyUp(): void {
        child.execSync(`rm -r ${this.runFolder}`);
    }
}



export class PlannerCall {

    runFolder: string;
    protected task : PlanningTask;

    constructor(
        protected plannerSetting: string[],
        protected root: string,
        protected runId: string,
        protected planningTask: PlanningTask,
        protected hardGoals: PlanProperty[],
        protected softGoals: PlanProperty[]) {

        this.task = planningTask;
        this.runFolder = path.join(root, String(this.runId));

        this.create_experiment_setup();
    }

    create_experiment_setup(): void {

        child.execSync(`rm -rf ${this.runFolder}`);
        child.execSync(`mkdir -p ${this.runFolder}`);

        const task_definition: string[] = this.task.toPDDL();

        writeFileSync(path.join(this.runFolder, 'domain.pddl'),
            task_definition[0],
            'utf8');

        writeFileSync(path.join(this.runFolder, 'problem.pddl'),
            task_definition[1],
            'utf8');

        writeFileSync(path.join(this.runFolder, 'exp_setting.json'),
            JSON.stringify(this.generate_experiment_setting(), null, 1),
            'utf8');

        // child.execSync(`cp -r ${environment.planner} ${this.runFolder}/fast-downward`);
        child.execSync(`ln -s ${environment.planner} ${this.runFolder}/fast-downward`);
    }

    generate_experiment_setting(): ExperimentSetting {
        const hardGoals: string[] = this.hardGoals.map(p => p.name);
        const softGoals: string[] = this.softGoals.map(p => p.name);
        const properties: PlanProperty[] = this.hardGoals.concat(this.softGoals);

        return { hard_goals: hardGoals, plan_properties: properties, soft_goals: softGoals, relaxed_tasks: []};
    }

    async executeRun(): Promise<CallResult> {

        const addArgs = [this.runFolder,
            '--build', 'release64',
            // '--overall-memory-limit', '2G',
            // '--overall-time-limit', '30m',
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

        return new Promise<CallResult>(async (resolve,rejects) => {
        
            const plannerResults : CallResult = await pythonShellCallFD(options);

            if(plannerResults.log && plannerResults.log.length > 0){
                let log = plannerResults.log.join('\n');
                console.log("Planner Log:");
                // console.log(log);
                writeFileSync(path.join(environment.resultsPath, `out_${this.runId}.log`), log, 'utf8');
            }
            else{
                console.log("No LOG");
            }

            if (plannerResults.error == 0)
                this.copy_experiment_results(plannerResults);

            this.tidyUp();

            resolve(plannerResults);
            return
        });
    }

    copy_experiment_results(result : CallResult): void {
        // implement in subclass
    }

    tidyUp(): void {
        child.execSync(`rm -fr ${this.runFolder}`);
    }
}


export class PlannerCallModifiedTask extends PlannerCall {


    constructor(
        protected plannerSetting: string[],
        protected root: string,
        protected runId: string,
        protected modTask: ModifiedPlanningTask,
        protected relaxedTasks: RelaxedTaskNode[],
        protected hardGoals: PlanProperty[],
        protected softGoals: PlanProperty[],
        additionalTaskUpdates: FactUpdate[] = []) {
        super(plannerSetting, root, runId, modTask.getUpdatedPlanningTask(additionalTaskUpdates), hardGoals, softGoals)

        this.create_experiment_setup();
    }

    generate_experiment_setting(): ExperimentSetting {
        const hardGoals: string[] = this.hardGoals.map(p => p.name);
        const softGoals: string[] = this.softGoals.map(p => p.name);
        const properties: PlanProperty[] = this.hardGoals.concat(this.softGoals);

        return { hard_goals: hardGoals, plan_properties: properties, soft_goals: softGoals, relaxed_tasks: this.relaxedTasks};
    }
}


// const plannerSettingOptPlan = ['--search', 'astar(hmax())'];
const plannerSettingOptPlan = ['--search', 'astar(iPDB())'];
const plannerSettingSatPlan = ['--search', 'lazy_greedy([ff()], preferred=[ff()])'];
export class PlanCall extends PlannerCallModifiedTask{

    constructor(root: string, private step: IterationStep) {
        super(plannerSettingOptPlan, root, step._id, ModifiedPlanningTask.fromObject(step.task), [], step.hardGoals, step.softGoals);
    }

    copy_experiment_results(result : CallResult): void {
        if (! this.step.plan) {
            return 
        }
        this.step.plan.log = environment.serverResultsPath + `/out_${this.runId}.log`;
        if(! result.planFound){
            return
        }
        const buffer: Buffer = readFileSync(path.join(this.runFolder, 'sas_plan'));
        this.step.plan.result = buffer.toString('utf8');
    }
}



// const plannerSettingMUGS = ['--translate-options', '--all-goals-as-sas-goal-facts',
//     '--search-options', '--heuristic', 'h=hc(nogoods=false, cache_estimates=false)', '--heuristic',
//    'mugs_h=mugs_hc(hc=h, all_softgoals=false)', '--search', 'dfs(u_eval=mugs_h)'];
const plannerSettingMUGS = ['--translate-options', '--all-goals-as-sas-goal-facts',
   '--search-options', '--heuristic', 'hmugs=mugs_hmax(all_softgoals=false)', '--search', 'dfs(u_eval=hmugs)'];
export class ExplanationCall extends PlannerCall{

    constructor(root: string, step: IterationStep, private depExpRun: DepExplanationRun) {
        super(plannerSettingMUGS, root, step._id, new PlanningTask(step.task.basetask), depExpRun.hardGoals, depExpRun.softGoals);
    }

    copy_experiment_results(result : CallResult): void {

        const filePath = path.join(this.runFolder, 'mugs.json');
        if(fs.existsSync(filePath)){
            const buffer: Buffer = readFileSync(filePath);
            const MUGSString = buffer.toString('utf8');
            this.depExpRun.result = MUGSString;
            const json : {name: string, MUGS: string[][]}[] = JSON.parse(MUGSString).relaxations;
            this.depExpRun.dependencies = { conflicts: toConflicts(json[0].MUGS, this.softGoals)};
        }
        else {
            console.log("No mugs file!")
        }

        if(result.log && result.log.length > 0)
            this.depExpRun.log = environment.serverResultsPath + `/out_${this.runId}.log`;
    }
}

export class ExplanationDemoCall extends PlannerCall{

    constructor(root: string, demo: Demo, private depExpRun: DepExplanationRun) {
        super(plannerSettingMUGS, root, demo._id, new PlanningTask(demo.baseTask), depExpRun.hardGoals, depExpRun.softGoals);
    }

    copy_experiment_results(result : CallResult): void {

        const filePath = path.join(this.runFolder, 'mugs.json');
        if(fs.existsSync(filePath)){
            const buffer: Buffer = readFileSync(filePath);
            const MUGSString = buffer.toString('utf8');
            this.depExpRun.result = MUGSString;
            const json : {name: string, MUGS: string[][]}[] = JSON.parse(MUGSString).relaxations;
            this.depExpRun.dependencies = { conflicts: toConflicts(json[0].MUGS, this.softGoals)};
        }
        else {
            console.log("No mugs file!")
        }

        if(result.log && result.log.length > 0)
            this.depExpRun.log = environment.serverResultsPath + `/out_${this.runId}.log`;
    }
}

// --translate-options --all-goals-as-sas-goal-facts --search-options --heuristic 'h=hc(nogoods=false, cache_estimates=false)' --heuristic 'mugs_h=mugs_hc(hc=h, all_softgoals=false)' --search 'dfs(u_eval=mugs_h)'

const plannerSettingRelaxExp = ['--translate-options', '--all-goals-as-sas-goal-facts',
   '--search-options', "--heuristic", "hmugs=mugs_hmax(all_softgoals=false)",
   "--search", "dwq_iterated([dfs(u_eval=hmugs)], heu=[hmugs])"];
export class RelaxExplanationCall extends PlannerCallModifiedTask{

    constructor(root: string, step: IterationStep, private relaxExpRun: RelaxationExplanationRun, possibleUpdates: RelaxationDimension[]) {
        super(plannerSettingRelaxExp, root, step._id, ModifiedPlanningTask.fromObject(step.task), 
        toRelaxTaskDefinition('', filterRelaxations(step.task.initUpdates, possibleUpdates)), 
        [], [...step.hardGoals, ...step.softGoals],
        getAdditionalUpdates(possibleUpdates));
    }

    copy_experiment_results(result : CallResult): void {

        const filePath = path.join(this.runFolder, 'relaxation_mugs.json');
        if(fs.existsSync(filePath)){
            const buffer: Buffer = readFileSync(filePath);
            const MUGSString = buffer.toString('utf8');

            this.relaxExpRun.result = MUGSString;
            const json : {name: string, MUGS: string[][]}[] = JSON.parse(MUGSString).relaxations;
            let explanationNodes: RelaxationExplanationNode[] = []
            for(let node of this.relaxedTasks) {
                let result = json.find(r => r.name == node.name);

                if (!!result) {
                    explanationNodes.push({
                        name: result.name, 
                        dependencies: {conflicts: toConflicts(result.MUGS, [...this.hardGoals, ...this.softGoals])},
                        updates: node.updates,
                        lower_cover: node.lower_cover,
                        upper_cover: node.upper_cover
                    });
                }
            }
            this.relaxExpRun.dependencies = explanationNodes;
        }
        else{
            console.log('mugs.json file does not exist!');
        }

        if(result.log && result.log.length > 0)
            this.relaxExpRun.log = environment.serverResultsPath + `/out_${this.runId}.log`;
    }
}

// --translate-options --all-goals-as-sas-goal-facts --search-options --heuristic 'hmugs=mugs_hmax(all_softgoals=true)' --search 'dwq_iterated([dfs(u_eval=hmugs)], heu=[hmugs])'


export class RelaxExplanationDemoCall extends PlannerCallModifiedTask{

    constructor(root: string, id: string, modTask: ModifiedPlanningTask, planProperties: PlanProperty[], private relaxExpRun: RelaxationExplanationRun, possibleUpdates: RelaxationDimension[]) {
        super(plannerSettingRelaxExp, root, id, modTask, 
        toRelaxTaskDefinition('', filterRelaxations(modTask.initUpdates, possibleUpdates)), 
        [], planProperties, getAdditionalUpdates(possibleUpdates));
    }

    copy_experiment_results(result : CallResult): void {

        const filePath = path.join(this.runFolder, 'relaxation_mugs.json');
        if(fs.existsSync(filePath)){
            const buffer: Buffer = readFileSync(filePath);
            const MUGSString = buffer.toString('utf8');
            console.log(MUGSString);
            this.relaxExpRun.result = MUGSString;
            const json : {name: string, MUGS: string[][]}[] = JSON.parse(MUGSString).relaxations;
            let explanationNodes: RelaxationExplanationNode[] = []
            for(let node of this.relaxedTasks) {
                let result = json.find(r => r.name == node.name);

                if (!!result) {
                    let mugs = toConflicts(result.MUGS, [...this.hardGoals, ...this.softGoals]);
                    explanationNodes.push({
                        name: result.name, 
                        dependencies: {conflicts: mugs},
                        updates: node.updates,
                        lower_cover: node.lower_cover,
                        upper_cover: node.upper_cover
                    });
                }
            }
            this.relaxExpRun.dependencies = explanationNodes;
            // console.log(this.relaxExpRun.dependencies)
        }
        else{
            console.log('mugs.json file does not exist!');
        }

        if(result.log && result.log.length > 0)
            this.relaxExpRun.log = environment.serverResultsPath + `/out_${this.runId}.log`;
    }
}