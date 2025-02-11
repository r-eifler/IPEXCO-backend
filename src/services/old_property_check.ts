import * as child from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';
import { environment } from '../app';
import { PDDLPlanningModel, toPDDL } from '../db_schema/PDDL_model';
import { Action } from '../db_schema/plan-properties/action_set';
import { PlanProperty } from '../db_schema/plan-properties/plan_property';
import { pythonShellCallSimple } from './python-call';

interface ExperimentSetting {
    plan_properties: PlanProperty[];
    hard_goals: string[];
    soft_goals: string[];
}


export class PropertyCheck {

    runFolder: string;

    constructor(
        protected root_run_folder: string,
        run_id: string,
        model: PDDLPlanningModel,
        plan: Action[],
        private planProperties: PlanProperty[])
    {

        this.runFolder = path.join(root_run_folder, run_id);

        child.execSync(`mkdir -p ${this.runFolder}`);

        const [domain, problem] = toPDDL(model, false);

        writeFileSync(path.join(this.runFolder, 'domain.pddl'),
            domain,
            'utf8')

        writeFileSync(path.join(this.runFolder, 'problem.pddl'),
            problem,
            'utf8')

        writeFileSync(path.join(this.runFolder, 'model.json'),
            JSON.stringify(model),
            'utf8')

        writeFileSync(path.join(this.runFolder, 'exp_setting.json'),
            JSON.stringify(this.generate_experiment_setting()),
            'utf8');

        writeFileSync(path.join(this.runFolder, 'plan.json'),
            JSON.stringify(plan),
            'utf8');
    }

    generate_experiment_setting(): ExperimentSetting {
        return { 
            plan_properties: this.planProperties, 
            hard_goals: [], 
            soft_goals: []
        };
    }

    async executeRun(): Promise<string[]> {

        const addArgs = [
            path.join(this.runFolder, 'domain.pddl'),
            path.join(this.runFolder, 'problem.pddl'),
            path.join(this.runFolder, 'exp_setting.json'),
            path.join(this.runFolder, 'model.json'),
            path.join(this.runFolder, 'plan.json')
        ];

        console.log(addArgs.join(' '))

        const options = {
            mode: 'text',
            pythonPath: '/usr/bin/python3',
            pythonOptions: ['-u'],
            scriptPath: environment.propertyChecker,
            args: addArgs,
            env: { VAL: environment.val},
        };

        return await pythonShellCallSimple('main.py', options);
    }

    tidyUp(): void {
        child.execSync(`rm -r ${this.runFolder}`);
    }
}


