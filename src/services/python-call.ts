import { PythonShell, PythonShellError } from 'python-shell';

export interface CallResult{
    error: number;
    planFound: boolean;
    log: string[];
}


export function pythonShellCallSimple(scriptPath: string, options: any): Promise<string[]> {
    return new Promise((resolve, reject) => {
        PythonShell.run(scriptPath, options).then(
        (results: any[]) => {
            // console.log('Python call successful');
            // console.log(results)
            resolve(results);
        },
        (error: any) => {
            console.log('Python call failed')
            console.log(error);
            reject(error);
        });
    });
}
