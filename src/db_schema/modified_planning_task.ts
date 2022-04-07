import { FactUpdate, FactUpdateSchema } from './relaxations';
import mongoose, { Document, Schema } from 'mongoose';
import { PlanningTask } from './planning_task';
import { Fact } from './base_planning_task';

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

    getUpdatedPlanningTask(add_updates : FactUpdate[] = []): PlanningTask {
      let copyTask = new PlanningTask(this.basetask);

      let updates = [...this.initUpdates]
      updates = updates.filter(f1 => ! add_updates.some(f2 => equalsFact(f2.orgFact, f1.orgFact)));
      updates = [...updates, ...add_updates];

      copyTask.initial = copyTask.initial.filter(f => ! updates.some(u => equalsFact(u.orgFact, f)));
      updates.forEach(u => copyTask.initial.push(u.newFact));

      return copyTask;
    }
  }

  function equalsFact(f1: Fact, f2: Fact): boolean {
    return f1.name == f2.name && JSON.stringify(f1.arguments) === JSON.stringify(f2.arguments)
  }

export const ModifiedPlanningTaskSchema = new Schema({
    name: { type: String, required: true},
    basetask: { type: mongoose.Schema.Types.ObjectId, ref: 'planning-task' },
    initUpdates: [FactUpdateSchema],
});

// export const ModifiedPlanningTaskModel = mongoose.model<ModifiedPlanningTask>('modified-planning-task', ModifiedPlanningTaskSchema);