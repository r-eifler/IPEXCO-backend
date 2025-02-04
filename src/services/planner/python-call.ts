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

export function pythonShellCallFD(options: any): Promise<CallResult> {
    return new Promise((resolve, reject) => {
        // @ts-ignore
        PythonShell.run('run_FD.py', options,  (err: PythonShellError, results: any) => {
            if (err) {
                if (err.exitCode === 12) {
                    console.log("pythonShellCallFD no plan found");
                    resolve({error:0, planFound: false, log: results});
                    return;
                }
                if (err.exitCode === 22 || err.exitCode === 23) {
                    console.log("pythonShellCallFD error: " + err.exitCode);
                    resolve({error: err.exitCode, planFound: false, log: []});
                    return;
                }
                console.log("pythonShellCallFD error: " + err.exitCode);
                reject(err);
                return;
            }
            else {
                console.log("pythonShellCallFD successful")
                resolve({error: 0,  planFound: true, log: results});
                return;
            }
        });
    });

}
