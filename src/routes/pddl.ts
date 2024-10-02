
import express from 'express';
import { auth } from '../middleware/auth';
import { InstantAction, parser } from 'pddl-workspace';
import { PDDLAction, PDDLFact, PlanningDomain, PlanningProblem } from '../db_schema/planning_task';
import { PddlSyntaxNode, PddlTokenType } from 'pddl-workspace/dist/parser';

export const pddlRouter = express.Router();


function extractGoal(node: PddlSyntaxNode): PDDLFact[] | null{

    if(node.getToken().type == PddlTokenType.OpenBracketOperator){
        if(node.getToken().tokenText.includes('goal')){
            console.log(node.getChildren())
            console.log("--------------------------------")
            for(let c of node.getChildren()){
                console.log(c.getToken().type)
                console.log(c.getToken().tokenText)
                if(c.getToken().type == PddlTokenType.OpenBracketOperator || c.getToken().type == PddlTokenType.OpenBracket){
                    console.log(c.getChildren())
                    return extractFactsFromParseTree(c)
                }
                console.log("-------------")
            }
        }
    }

    for(let c of node.getChildren()){
        let goals: PDDLFact[] | null =  extractGoal(c)
        if(goals != null){
            return goals
        }
    }   

    return null
}


function extractFact(node: PddlSyntaxNode): PDDLFact{
    let fact : PDDLFact = {name: '', arguments: [], negated: false }

    if(node.getToken().type == PddlTokenType.OpenBracketOperator){
        fact.name = node.getToken().tokenText.replace('(','')
    }

    for(let p of node.getChildren()){

        if(p.getToken().type == PddlTokenType.Other && fact.name == ''){
            fact.name = p.getToken().tokenText
            continue
        }

        if(p.getToken().type == PddlTokenType.Other && fact.name != ''){
            fact.arguments.push(p.getToken().tokenText)
            continue
        }

        if(p.getToken().type == PddlTokenType.Parameter){
            fact.arguments.push(p.getToken().tokenText);
            continue
        }
    }

    if(fact.name != 'not'){
        return fact
    }


    for(let c of node.getChildren()){
        if(c.getToken().type != PddlTokenType.OpenBracket){
            // skip any whitespace nodes
            continue;
        }
        let fact = extractFact(c);
        fact.negated = true;
        return fact
    }

    return fact
}


function extractFactsFromParseTree(node: PddlSyntaxNode) {

    let res: PDDLFact[] = [];

    if(node.getToken().type == PddlTokenType.OpenBracketOperator){
        for(let c of node.getChildren()){
            if(c.getToken().type == PddlTokenType.OpenBracket || c.getToken().type == PddlTokenType.OpenBracketOperator){
                let fact = extractFact(c);
                res.push(fact)
            }

        }
        return res;
    }
    
    if(node.getToken().type == PddlTokenType.OpenBracket){
        let fact = extractFact(node);

        if(fact.name == 'AND'){
            for(let c of node.getChildren()){
                if(c.getToken().type != PddlTokenType.OpenBracket){
                    // skip any whitespace nodes
                    continue;
                }
                let fact = extractFact(c);
                res.push(fact);
            }
        }
        else{
            res.push(fact)
            return res
        }
    }

    return res;
}

pddlRouter.post('/domain', auth,  async (req, res) => {
    try {
        let domainText = req.body.data
        let domainParsed = parser.PddlDomainParser.parseText(domainText)

        if(domainParsed == undefined) {
            res.status(500).send("Parsing domain failed!");
            return
        }

        // console.log(domainParsed)

        let domain: PlanningDomain = {
            types: [],
            predicates: [],
            actions: []
        }

        for(let t of domainParsed.getTypes()){
            domain.types.push({name: t, parent: 'TODO'})
        }

        for(let p of domainParsed?.getPredicates()){
            domain.predicates.push({
                name: p.name, 
                parameters: p.parameters.map(e => (
                    {
                        name: e.toPddlString().split(' - ')[0], 
                        type: e.type
                    })),
                negated: false
            })
        }

        

        for(let a of domainParsed.getActions() as InstantAction[]){
            // console.log('--------------------- ' + a.name + ' ---------------------------')
            // console.log(a)
            // console.log( a.parameters)
            
            if(a.preCondition == undefined || a.effect == undefined){
                break
            }

            let action: PDDLAction = {
                name: a.name != undefined ? a.name : 'NONE', 
                parameters: a.parameters.map(p => ({name: p.name, type: p.type})),
                precondition: [],
                effect: []
            }

            action.precondition = extractFactsFromParseTree(a.preCondition)
            action.effect = extractFactsFromParseTree(a.effect)

            console.log(action.name);
            console.log(action.parameters);
            console.log(action.precondition);
            console.log(action.effect);
            domain.actions.push(action);
        }

        res.status(200).send({data: domain})

    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});


pddlRouter.post('/problem', auth,  async (req, res) => {
    try {
        let problemText = req.body.data
        let problemParsed = await parser.PddlProblemParser.parseText(problemText)

        if(problemParsed == undefined) {
            res.status(500).send("Parsing problem failed!");
            return
        }

        let problem: PlanningProblem = {
            objects:[],
            initial: [],
            goal: []
        }

        problem.initial = problemParsed.getInits().map(i => {
            let parts = i.getVariableName().split(' ')
            if(i.getValue() == true){
                return {name: parts[0], arguments: parts.slice(1), negated: false}
            }
            else {
                return {name: parts[0], arguments: parts.slice(1), value: i.getValue(), negated: false}
            }
        })

        let raw_object_types = (problemParsed.getObjectsTypeMap().toJSON('test') as any)

        if(problemParsed.getObjectsTypeMap().length == 1){
            problem.objects = raw_object_types['object']['objects'].map((n: string) => ({name: n, type: 'object'}))
        }
        else {
            for(const [type_name, rot] of Object.entries(raw_object_types)){
                problem.objects = problem.objects.concat((rot as any)['objects']
                    .filter((n: string) => problemParsed.getObjects(n).length == 0)
                    .map((n: string) => ({name: n, type: type_name}))
                )
            }
        }


        let goals = extractGoal(problemParsed.syntaxTree.getRootNode())

        if(goals == undefined) {
            res.status(500).send("Parsing problem failed!");
            return
        }

        problem.goal = goals
        

        console.log(problem.objects)
        console.log(problem.initial)
        console.log(problem.goal)

        //TODO metrics

        res.status(200).send({data: problem})

    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
});


