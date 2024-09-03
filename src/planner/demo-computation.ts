import { Demo } from './../db_schema/demo';
import { PlanProperty } from '../db_schema/plan-properties/plan_property';


export class DemoComputation {

    constructor(
        private root: string,
        private demo: Demo,
        private planProperties: PlanProperty[]) {
    }

    async run(): Promise<boolean> {

        return new Promise<boolean>(async (resolve,rejects) => {
            // TODO
            return;
        });

    }

   
}
