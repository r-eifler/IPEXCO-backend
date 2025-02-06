import * as child from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';
import { environment } from '../../app';
import { IterationStep } from '../../db_schema/iteration_step';
import { PlanProperty } from '../../db_schema/plan-properties/plan_property';
import { toPDDL } from '../../db_schema/planning_task';
import { pythonShellCallSimple } from './python-call';

interface ExperimentSetting {
    plan_properties: PlanProperty[];
    hard_goals: string[];
    soft_goals: string[];
}


export class PropertyCheck {

    runFolder: string;

    constructor(
        protected root: string,
        private step: IterationStep,
        private planProperties: PlanProperty[])
    {

        this.runFolder = path.join(root, String(step._id));

        child.execSync(`mkdir -p ${this.runFolder}`);

        const [domain, problem] = toPDDL(this.step.task.model, false);

        writeFileSync(path.join(this.runFolder, 'domain.pddl'),
            domain,
            'utf8')

        writeFileSync(path.join(this.runFolder, 'problem.pddl'),
            problem,
            'utf8')

        writeFileSync(path.join(this.runFolder, 'model.json'),
            this.step.task.model,
            'utf8')

        writeFileSync(path.join(this.runFolder, 'exp_setting.json'),
            JSON.stringify(this.generate_experiment_setting()),
            'utf8');

        if(this.step.plan?.actions === undefined) {
            throw(Error)
        }

        writeFileSync(path.join(this.runFolder, 'plan.json'),
            this.step.plan?.actions,
            'utf8');
    }

    generate_experiment_setting(): ExperimentSetting {
        return { hard_goals: [], plan_properties: this.planProperties, soft_goals: []};
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


