import { PythonShell, PythonShellError } from 'python-shell';

export interface CallResult{
    error: number;
    planFound: boolean;
    log: string[];
}


export function pythonShellCallSimple(scriptPath: string, options: any): Promise<string[]> {
    return new Promise((resolve, reject) => {
        // @ts-ignore
        PythonShell.run(scriptPath, options,  (err: any, results: any) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                console.log('PYTHON CALL SUCC');
                console.log(results)
                resolve(results);
            }
        });
    });
}
