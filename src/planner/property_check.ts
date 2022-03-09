import { Project } from './../db_schema/project';
import path from 'path';
import { PlanRun } from '../db_schema/iteration_step';
import { PlanProperty } from '../db_schema/plan-properties/plan_property';
import { ExperimentSetting } from './experiment_setting';
import * as child from 'child_process';
import { writeFileSync } from 'fs';
import { pythonShellCallSimple } from './python-call';
import { environment } from '../app';
import { Task } from '../db_schema/task';

export class PropertyCheck {

    runFolder: string;

    constructor(
        protected root: string,
        private project: Project,
        private task: Task,
        private planProperties: PlanProperty[],
        private planRun: PlanRun)
    {
        this.runFolder = path.join(root, String(this.planRun._id));

        child.execSync(`mkdir -p ${this.runFolder}`);

        const domainFileName = path.basename(project.domainFile.path);
        const problemFileName = path.basename(project.problemFile.path);

        child.execSync(`cp ${path.join(environment.uploadsPath, domainFileName)} ${path.join(this.runFolder, 'domain.pddl')}`);
        child.execSync(`cp ${path.join(environment.uploadsPath, problemFileName)} ${path.join(this.runFolder, 'problem.pddl')}`);

        writeFileSync(path.join(this.runFolder, 'schema.json'),
            this.task.taskSchema(),
            'utf8')

        writeFileSync(path.join(this.runFolder, 'exp_setting.json'),
            JSON.stringify(this.generate_experiment_setting()),
            'utf8');

        writeFileSync(path.join(this.runFolder, 'plan.sas'),
            this.planRun.result,
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
            path.join(this.runFolder, 'schema.json'),
            path.join(this.runFolder, 'plan.sas')
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
