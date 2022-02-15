import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';

import { getGoalFacts } from '../planner/pddl_file_utils';
import { FileModel, File } from '../db_schema/file';

export const pddlFileRouter = express.Router();

const imgPort = 'http://localhost:3000';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(path.resolve(__dirname, '..'), 'data/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    },
});

const fileFilter = (req: any, file: any, cb: (arg0: null, arg1: boolean) => void) => {
    cb(null, true);
    /*if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }*/
};

const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter
});

pddlFileRouter.post('/', upload.single('content'), async (req, res) => {
    try {
        const file = new FileModel({
            name: req.body.name,
            path: '/uploads/' + req.file?.filename,
            type: req.body.type,
            domain: req.body.domain
        });
        if (!file) {
            return res.status(403).send('File could not be saved.');
        }
        const data = await file.save();

        res.send({
            status: true,
            message: 'File uploaded successfully.',
            data
        });
    } catch (ex) {
        res.send(ex.message);
    }
});

pddlFileRouter.get('/type/:type', async (req, res) => {
    try {
        const fileType = req.params.type;
        const pddlFiles = await  FileModel.find({ type: fileType });
        if (!pddlFiles) { return res.status(404).send({ message: 'No PDDL files found.' }); }
        res.send({
            data: pddlFiles
        });
    } catch (ex) {
        res.send(ex.message);
    }
});

pddlFileRouter.get('/:id', async (req, res) => {
    try {
        const id = mongoose.Types.ObjectId(req.params.id);
        const pddlFile = await FileModel.findOne({ _id: id });
        if (!pddlFile) { return res.status(404).send({ message: 'No PDDL file found.' }); }
        res.send({
            data: pddlFile
        });
    } catch (ex) {
        res.send(ex.message);
    }
});

pddlFileRouter.get('/:id/goal-facts', async (req, res) => {
    try {
        const id = mongoose.Types.ObjectId(req.params.id);

        const pddlFile: File | null = await FileModel.findOne({ _id: id });
        if (!pddlFile) { return res.status(404).send({ message: 'No PDDL file found.' }); }

        const goals: string[] = await getGoalFacts(pddlFile);
        res.send({
            data: goals
        });
    } catch (ex) {
        res.send(ex.message);
    }
});

pddlFileRouter.delete('/:id', async (req, res) => {
    try {
        const id = mongoose.Types.ObjectId(req.params.id);
        const pddlFile = await FileModel.deleteOne({ _id: id });
        if (!pddlFile) { return res.status(404).send({ message: 'No PDDL file found.' }); }

        res.send({
            data: pddlFile
        });
    } catch (ex) {
        res.send(ex.message);
    }
});

