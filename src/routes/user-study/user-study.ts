import { UserStudyModel, UserStudy } from '../../db_schema/user-study/user-study';
import express from 'express';
import { auth, authForward, AuthenticatedRequest } from '../../middleware/auth';

export const userStudyRouter = express.Router();


userStudyRouter.post('/', auth, async (req: any, res) => {
    try {
        console.log(req.body.data);
        const userStudyData = req.body.data as UserStudy;
        userStudyData.user = req.user._id;

        const userStudy: UserStudy = new UserStudyModel(userStudyData);

        if (!userStudy) {
            res.status(403).send('user study failed');
            return;
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
        await UserStudyModel.replaceOne({ _id: req.params.id}, userStudyData);

        const userStudy: UserStudy | null = await UserStudyModel.findOne({ _id: refId});

        if (!userStudy) {
            res.status(403).send('update user study failed');
            return;
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


userStudyRouter.get('/', auth, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            res.status(401).send()
            return;
        }
        const allStudies: UserStudy[] = await UserStudyModel.find();

        const studies = allStudies.filter(
            s => s.available || (req.user && s.user.toString() == req.user._id.toString())
        );

        if (!studies) { 
            res.status(404).send({ message: 'Lookup user studies failed.' })
            return;
        }

        res.send({
            data: studies
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});



userStudyRouter.get('/:id', authForward, async (req: AuthenticatedRequest, res) => {

    try {
        const id = req.params.id;
        const userStudy = await UserStudyModel.findOne({ _id: id });

        if (!userStudy) { 
            res.status(404).send({ message: 'No user study found.' });
            return;
        }

        if (req.user && userStudy.user.toString() !== req.user._id.toString()){
            if(! userStudy.available){
                res.status(404).send({ message: 'User study currently not available.' });
                return;
            }

            const now = new Date();
            const start  = new Date(userStudy?.startDate);
            const end = new Date(userStudy.endDate); 
            if (now < start || now > end){
                res.status(404).send('User Study not available anymore!');
                return;
            } 
        }



        res.send({
            data: userStudy
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});

userStudyRouter.delete('/:id', auth, async (req: AuthenticatedRequest, res) => {

    try {
        if (!req.user) {
            res.status(401).send();
            return;
        }

        const id = req.params.id;
        const userStudy = await UserStudyModel.deleteOne({ _id: id, user: req.user._id});

        if (!userStudy) { 
            res.status(404).send({ message: 'No user study found.' })
            return;
        }

        res.send({
            data: userStudy
        });
    } catch (ex : any) {
        console.log(ex.message);
        res.status(500).send();
    }

});
