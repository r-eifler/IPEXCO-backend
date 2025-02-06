import { readFile } from 'fs';
import 'assert';
import path from 'path';
import * as child from 'child_process';
import { environment } from '../../app';


// export async function getGoalFacts(pddFile: File): Promise<string[]> {
//     console.assert(pddFile.type === 'problem');
//     const localPath = path.join(environment.uploadsPath, path.basename(pddFile.path));

//     const fileContentPromise = new Promise<string>((resolve, reject) => {
//         readFile(localPath, (err, buffer) => {
//             if (err) {
//                 reject(err);
//                 return;
//             }
//             const content = buffer.toString('utf8');
//             resolve(content);
//         });
//     });

//     const fileContent = await fileContentPromise;
//     return parseGoalFacts(fileContent);
// }

// function parseGoalFacts(content: string) {
//     const lines: string[] = content.split('\n');
//     const goalsStrings: string[] = [];
//     for (let i = 0; i < lines.length; i++) {
//         let line: string = lines[i];
//         if (line.includes(':goal')) {
//             i++; // line with opening bracket
//             line = lines[++i];
//             while (!line.startsWith(')')) {
//                 goalsStrings.push(line);
//                 line = lines[++i];
//             }
//         }
//     }
//     return goalsStrings.map((value, index) => {
//         const noBrackets = value.replace('(', '').replace(')', '');
//         const [op, ...args] = noBrackets.split(' ');
//         return op + '(' + args.join(',') + ')';
//     });
// }

// function deleteFile(filepath: string): void {
//     child.spawnSync('rm ', [filepath]);
// }

// function deleteFolder(folderPath: string): void {
//     child.spawnSync('rm ', ['-r', folderPath]);
// }

// export function deleteResultFile(filepath: string): void {
//     const filename = path.basename(filepath);
//     deleteFile(path.join(environment.resultsPath, filename));
// }

// export function deleteResultFolder(folderName: string): void {
//     deleteFile(path.join(environment.resultsPath, folderName));
// }

// export function deleteUploadFile(filepath: string): void {
//     const filename = path.basename(filepath);
//     deleteFile(path.join(environment.uploadsPath, filename));
// }

