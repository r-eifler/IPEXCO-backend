import mongoose, { Schema } from 'mongoose';
import { PlanningTask } from './planning_task';

export class UpdatedPlanningTask{
    _id?: string;
    name: string;
    parent_task: PlanningTask;
    task: PlanningTask;

    constructor(name: string, baseTask: PlanningTask, updated_task: PlanningTask) {
      this.name = name;
      this.parent_task = baseTask;
      this.task = updated_task;
    }
  
    static fromObject(o: UpdatedPlanningTask) {
      let task = new UpdatedPlanningTask(o.name, o.parent_task, o.task);
      if(o._id){
        task._id = o._id
      }
      return task;
    }

  }


export const UpdatedPlanningTaskSchema = new Schema({
    name: { type: String, required: true},
    parent_task: { type: mongoose.Schema.Types.ObjectId, ref: 'planning-task' },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'planning-task' }
});

