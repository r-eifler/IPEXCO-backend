import mongoose, { Document, Schema } from 'mongoose';
import { PlanningTask } from './planning_task';
import { InitFactUpdate, InitFactUpdateSchema } from './relaxations';

export class ModifiedPlanningTask{
    _id?: string;
    name: string;
    basetask: PlanningTask;
    initUpdates: InitFactUpdate[];

    constructor(name: string, baseTask: PlanningTask, initUpdates: InitFactUpdate[]) {
      this.name = name;
      this.basetask = baseTask;
      this.initUpdates = initUpdates;
    }
  
    static fromObject(o: ModifiedPlanningTask) {
      let task = new ModifiedPlanningTask(o.name, o.basetask, o.initUpdates.map(e => InitFactUpdate.fromObject(e)));
      if(o._id){
        task._id = o._id
      }
      return task;
    }

    getUpdatedPlanningTask(): PlanningTask {

      let copyTask = new PlanningTask(this.basetask);
      copyTask.initial = copyTask.initial.filter(f => ! this.initUpdates.some(u => u.orgFact.equals(f)));
      this.initUpdates.forEach(u => copyTask.initial.push(u.newFact));
      return copyTask;
  }
  }

export const ModifiedPlanningTaskSchema = new Schema({
    name: { type: String, required: true},
    basetask: { type: mongoose.Schema.Types.ObjectId, ref: 'planning-task' },
    initUpdates: [InitFactUpdateSchema],
});

// export const ModifiedPlanningTaskModel = mongoose.model<ModifiedPlanningTask>('modified-planning-task', ModifiedPlanningTaskSchema);