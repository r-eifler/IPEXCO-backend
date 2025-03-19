import * as child from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';
import { environment } from '../../app';
import { pythonShellCallSimple } from '../python-call';

export class PDDLParser {
    

    runFolder: string;

    constructor(
        protected root: string,
        id: string,
        domainText: string,
        problemText: string)
    {
        this.runFolder = path.join(root, String(id));

        child.execSync(`mkdir -p ${this.runFolder}`);

        writeFileSync(path.join(this.runFolder, 'domain.pddl'),
            domainText,
            'utf8')

        writeFileSync(path.join(this.runFolder, 'problem.pddl'),
            problemText,
            'utf8')
    }

    async executeRun(): Promise<string[]> {
        const addArgs = [
            path.join(this.runFolder, 'domain.pddl'),
            path.join(this.runFolder, 'problem.pddl'),
        ];

        const options = {
            mode: 'text',
            pythonPath: this.getPythonPath(),
            pythonOptions: ['-u'],
            scriptPath: environment.pddlParser,
            args: addArgs,
        };

        console.log(options);

        return await pythonShellCallSimple('main.py', options);
    }

    private getPythonPath(): string {
        const venvPath = path.join(this.root, '.venv', 'bin', 'python');
        return require('fs').existsSync(venvPath) ? venvPath : '/usr/bin/python3';
    }

    tidyUp(): void {
        child.execSync(`rm -r ${this.runFolder}`);
    }
}
