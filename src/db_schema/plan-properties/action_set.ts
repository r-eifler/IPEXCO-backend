import mongoose, { Schema } from 'mongoose';
import { array, object, string, infer as zinfer } from "zod";

export const ActionZ = object({
    name: string(),
    params: array(string()),
});

export type Action = zinfer<typeof ActionZ>;

export const ActionSetZ = Object({
    _id: string(),
    name: string(),
    actions: array(ActionZ),
});

export type ActionSet = zinfer<typeof ActionSetZ>;

export const ActionSchema = new Schema({
    name: { type: String, required: true},
    params: [{ type: String, required: true}],
});

export const ActionSetSchema = new Schema({
    name: { type: String, required: true},
    actions: [{ type: ActionSchema, required: true}],
});

export const ActionSetModel = mongoose.model('action_set', ActionSetSchema);
export const ActionModel = mongoose.model('action', ActionSchema);

