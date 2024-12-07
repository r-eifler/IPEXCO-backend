import { UserStudyModel, UserStudy } from '../../db_schema/user-study/user-study';
import express from 'express';
import { auth, authForward, authUserStudy } from '../../middleware/auth';

export const userStudyRouter = express.Router();


userStudyRouter.post('/', auth, async (req: any, res) => {
    try {
        console.log(req.body.data);
        const userStudyData = req.body.data as UserStudy;
        userStudyData.user = req.user._id;

        const userStudy: UserStudy = new UserStudyModel(userStudyData);

        if (!userStudy) {
            return res.status(403).send('user study failed');
        }

        const data = await userStudy.save();

        res.send({
            status: true,
            message: 'user study created',
            data
        });
    }

    catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


userStudyRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = req.params.id;
        const userStudyData = req.body.data as UserStudy;
        console.log(userStudyData);
        await UserStudyModel.replaceOne({ _id: req.params.id}, userStudyData);

        const userStudy: UserStudy | null = await UserStudyModel.findOne({ _id: refId});

        if (!userStudy) {
            return res.status(403).send('update user study failed');
        }

        res.send({
            status: true,
            message: 'user study updated',
            data: userStudy
        });

    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }
});


userStudyRouter.get('/', auth, async (req: any, res) => {
    try {
        const allStudies: UserStudy[] = await UserStudyModel.find();

        console.log("#allStudies: " + allStudies.length);
        const studies = allStudies.filter(
            s => s.available || (req.user && s.user.toString() == req.user._id.toString())
        );

        console.log("#studies: " + studies.length);
        if (!studies) { 
            return res.status(404).send({ message: 'Lookup user studies failed.' });
        }

        res.send({
            data: studies
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});



userStudyRouter.get('/:id', authForward, authUserStudy, async (req: any, res) => {

    try {
        if (! req.user && ! req.userStudyUser) {
            return res.status(401).send({ message: 'Not authorized to access this resource' });
        }

        const id = req.params.id;
        const userStudy = await UserStudyModel.findOne({ _id: id });

        if (!userStudy) { 
            return res.status(404).send({ message: 'No user study found.' });
        }

        res.send({
            data: userStudy
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

userStudyRouter.delete('/:id', auth, async (req, res) => {

    try {
        const id = req.params.id;
        const userStudy = await UserStudyModel.deleteOne({ _id: id });

        if (!userStudy) { 
            return res.status(404).send({ message: 'No user study found.' });
        }

        res.send({
            data: userStudy
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});
