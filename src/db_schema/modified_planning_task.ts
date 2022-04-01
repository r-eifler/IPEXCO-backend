import { FactUpdate, FactUpdateSchema } from './relaxations';
import mongoose, { Document, Schema } from 'mongoose';
import { PlanningTask } from './planning_task';

export class ModifiedPlanningTask{
    _id?: string;
    name: string;
    basetask: PlanningTask;
    initUpdates: FactUpdate[];

    constructor(name: string, baseTask: PlanningTask, initUpdates: FactUpdate[]) {
      this.name = name;
      this.basetask = baseTask;
      this.initUpdates = initUpdates;
    }
  
    static fromObject(o: ModifiedPlanningTask) {
      let task = new ModifiedPlanningTask(o.name, o.basetask, o.initUpdates.map(e => FactUpdate.fromObject(e)));
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
    initUpdates: [FactUpdateSchema],
});

// export const ModifiedPlanningTaskModel = mongoose.model<ModifiedPlanningTask>('modified-planning-task', ModifiedPlanningTaskSchema);