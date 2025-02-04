
import express from 'express';
import { auth } from '../middleware/auth';
import { InstantAction, parser } from 'pddl-workspace';
import { PDDLAction, PDDLFact, PDDLObject, PlanningDomain, PlanningProblem } from '../db_schema/planning_task';
import { PddlSyntaxNode, PddlTokenType } from 'pddl-workspace/dist/parser';
import { PDDLParser } from '../services/planner/pddl_parser';
import { environment } from '../app';

export const pddlRouter = express.Router();


function extractGoal(node: PddlSyntaxNode): PDDLFact[] | null{

    if(node.getToken().type == PddlTokenType.OpenBracketOperator){
        if(node.getToken().tokenText.includes('goal')){
            for(let c of node.getChildren()){
                if(c.getToken().type == PddlTokenType.OpenBracketOperator || c.getToken().type == PddlTokenType.OpenBracket){
                    return extractFactsFromParseTree(c)
                }
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
        if(c.getToken().type != PddlTokenType.OpenBracketOperator){
            let fact = extractFact(c.getChildren()[0]);
            fact.name = '=';
            return fact
        }
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
        // console.log(domainText)
        let domainParsed = parser.PddlDomainParser.parseText(domainText)

        if(domainParsed == undefined) {
            res.status(500).send("Parsing domain failed!");
            return
        }

        let domain: PlanningDomain = {
            constants: [],
            types: [],
            predicates: [],
            actions: []
        }

        for(let t of domainParsed.getTypes()){
            domain.types.push({name: t.toLowerCase(), parent: 'TODO'})
        }

        for(let p of domainParsed?.getPredicates()){
            domain.predicates.push({
                name: p.name, 
                parameters: p.parameters.map(e => (
                    {
                        name: e.toPddlString().split(' - ')[0].toLowerCase(), 
                        type: e.type.toLowerCase()
                    })),
                negated: false
            })
        }

        

        for(let a of domainParsed.getActions() as InstantAction[]){
            
            if(a.preCondition == undefined || a.effect == undefined){
                break
            }

            let action: PDDLAction = {
                name: a.name != undefined ? a.name: 'NONE', 
                parameters: a.parameters.map(p => ({name: '?' + p.name, type: p.type})),
                precondition: [],
                effect: []
            }

            action.precondition = extractFactsFromParseTree(a.preCondition)
            action.effect = extractFactsFromParseTree(a.effect)

            action = {
                name: action.name.toLowerCase(),
                parameters: action.parameters.map(p => ({name: p.name.toLowerCase(), type: p.type.toLowerCase()})),
                precondition: action.precondition.map(p => 
                    ({name: p.name.toLowerCase(), arguments: p.arguments.map(a => a.toLowerCase()), negated: p.negated})
                ),
                effect: action.effect.map(p => 
                    ({name: p.name.toLowerCase(), arguments: p.arguments.map(a => a.toLowerCase()), negated: p.negated})
                ),
            }

            domain.actions.push(action);
        }

        res.status(200).send({data: domain})

    } catch (error) {
        console.log(error);
        res.status(400).send();
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

        let initial = problemParsed.getInits().map(i => {
            let parts = i.getVariableName().split(' ')
            if(i.getValue() == true){
                return {name: parts[0], arguments: parts.slice(1), negated: false}
            }
            else {
                return {name: parts[0], arguments: parts.slice(1), value: i.getValue(), negated: false}
            }
        })

        let raw_object_types = (problemParsed.getObjectsTypeMap().toJSON('test') as any)

        let objects: PDDLObject[] = []
        if(problemParsed.getObjectsTypeMap().length == 1){
            objects = raw_object_types['object']['objects'].map((n: string) => ({name: n, type: 'object'}))
        }
        else {
            for(const [type_name, rot] of Object.entries(raw_object_types)){
                objects = objects.concat((rot as any)['objects']
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


        let problem: PlanningProblem = {
            objects: objects.map(o => ({...o,name: o.name.toLowerCase(), type: o.type.toLowerCase()})),
            initial: initial.map(f => ({...f, name: f.name.toLowerCase(), arguments: f.arguments.filter(a => a != '').map(a => a.toLowerCase())})),
            goal: goals.map(g => ({...g, name: g.name.toLowerCase(), arguments: g.arguments.filter(a => a != '').map(a => a.toLowerCase())}))
        }

        //TODO metrics

        res.status(200).send({data: problem})

    } catch (error) {
        console.log(error);
        res.status(500).send();
    }
});


pddlRouter.post('/model', auth,  async (req, res) => {
    try {
        let problemText = req.body.data.problem
        let domainText = req.body.data.domain
       

        const parser = new PDDLParser(environment.experimentsRootPath, Date.now().toString(), domainText, problemText)
        const modelLines = await parser.executeRun()

        const modelString: string = modelLines.reduce((m,l) => m + '\n' + l, '')
        const modelJSON = JSON.parse(modelString);

        //TODO metrics

        res.status(200).send({data: modelJSON})

    } catch (error) {
        console.log(error);
        res.status(500).send();
    }
});
