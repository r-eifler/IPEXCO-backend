import { Project } from './../db_schema/project';
import path from 'path';
import { PlanProperty } from '../db_schema/plan-properties/plan_property';
import { ExperimentSetting } from './experiment_setting';
import * as child from 'child_process';
import { writeFileSync } from 'fs';
import { pythonShellCallSimple } from './python-call';
import { environment } from '../app';
import { PlanningTask } from '../db_schema/planning_task';
import { IterationStep } from '../db_schema/iteration_step';

export class PropertyCheck {

    runFolder: string;

    constructor(
        protected root: string,
        private step: IterationStep,
        private planProperties: PlanProperty[])
    {
        this.runFolder = path.join(root, String(step._id));

        child.execSync(`mkdir -p ${this.runFolder}`);

        const task = new PlanningTask(this.step.task)
        const [domain, problem] = task.toPDDL();

        writeFileSync(path.join(this.runFolder, 'domain.pddl'),
            domain,
            'utf8')

        writeFileSync(path.join(this.runFolder, 'problem.pddl'),
            problem,
            'utf8')

        writeFileSync(path.join(this.runFolder, 'model.json'),
            task.model,
            'utf8')

        writeFileSync(path.join(this.runFolder, 'exp_setting.json'),
            JSON.stringify(this.generate_experiment_setting()),
            'utf8');

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
