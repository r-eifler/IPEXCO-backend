import { ModifiedPlanningTask } from './../db_schema/modified_planning_task';
import { Fact } from './../db_schema/base_planning_task';
import { PPDependencies, PPConflict } from './../db_schema/explanations';
import { GoalType, PlanProperty } from '../db_schema/plan-properties/plan_property';
import { FactUpdate, PossibleInitFactUpdates } from '../db_schema/relaxations';

export function updateMUGSPropsNames(json: string[][], planProperties: PlanProperty[]): string[][] {
    const newMUGS = [];
    for (const mugs of json) {
      const list = [];
      for (const elem of mugs) {
        if (elem.startsWith('Atom')) {
          const fact = elem.replace('Atom ', '').replace(' ', '');
          for (const p of planProperties) {
            if (p.type === GoalType.goalFact && fact === p.formula) {
              list.push(p.name);
              break;
            }
          }
        } else {
          list.push(elem.replace('sat_', '').replace('soft_accepting(', '').replace(')', ''));
        }
      }
      newMUGS.push(list);
    }
    return newMUGS;
  }
  
  export function toConflicts(json: string[][], planProperties: PlanProperty[]): PPConflict[] {
    const newMUGS = updateMUGSPropsNames(json, planProperties);
    let conflicts: PPConflict[] = [];
  
    for (const mugs of newMUGS) {
        let conflict : PPConflict = {elems: []};
        for(const e of mugs){
            const pp = planProperties.find(pp => pp.name == e);
            if(pp && pp._id){
                conflict.elems.push(pp._id)
            }
        }
        conflicts.push(conflict);
    }
    return conflicts;
  }

  function equalsFact(f1: Fact, f2: Fact): boolean {
    return f1.name == f2.name && JSON.stringify(f1.arguments) === JSON.stringify(f2.arguments)
  }

  export function filterRelaxations(selectedUdpates: FactUpdate[], possibleUpdates: PossibleInitFactUpdates[]): Fact[][]{
    console.log("filter Relaxations");
    let newPossibleUpdates: Fact[][] = [];
    possibleUpdates.forEach(possibleUpdate => {
      let list = [possibleUpdate.orgFact, ...possibleUpdate.updates];
      for (let update of selectedUdpates) {
        if (! equalsFact(update.orgFact, possibleUpdate.orgFact.fact)){
          continue;
        }
        for (let index = 0; index < list.length; index++){
          if(equalsFact(update.newFact, list[index].fact)){
            newPossibleUpdates.push(list.slice(index, list.length).map(e => e.fact));
            return;
          }
        }
      }
      let fact_list = list.map(e => e.fact)
      console.log("filtered Updates");
      console.log(fact_list);
      newPossibleUpdates.push(fact_list);
    })
    return newPossibleUpdates;
  }

  export interface RelaxedTaskNode {
    id: number;
    name: string;
    inits: string[];
    updates: Fact[];
    upper_cover: number[];
    lower_cover: number[];
}

  function format(fact: Fact): string{
    return fact.name + '_' + fact.arguments.join('_');
  }

  function factToString(fact: Fact): string {
    if (fact.negated) {
        return "! " + fact.name + "(" + fact.arguments.join(', ') + ")";
    }
    return fact.name + "(" + fact.arguments.join(', ') + ")";
}

  export function toRelaxTaskDefinition(base_name: string, relaxations: Fact[][]) {

    console.log("toRelaxTaskDefinition");
    console.log(relaxations);

    let nodes : RelaxedTaskNode[] = [];

    if (relaxations.length == 1){
      let relax = relaxations[0];
      let id = 0;
      for (let fact of relax) {
        nodes.push({
          id: id, 
          name: base_name + '_' + format(fact),
          inits: [factToString(fact)],
          updates: [fact],
          upper_cover: id < relax.length - 1 ? [id + 1] : [],
          lower_cover: id > 0 ? [id - 1] : [],
        });
        id++;
      }
      console.log("toRelaxTaskDefinition: Relaxed Nodes");
      console.log(nodes);
      return nodes;
    }

    if (relaxations.length == 2){

      let node_map = new Map<string, RelaxedTaskNode>();

      let relaxs1 = relaxations[0];
      let index1 = 0;

      let relaxs2 = relaxations[1];
      let index2 = 0;

      let id = 0;

      while(index1 < relaxs1.length && index2 < relaxs2.length){
        node_map.set(index1 + '_' + index2, {
          id: id, 
          name: base_name + '_' + format(relaxs1[index1]) + '_' + format(relaxs2[index2]),
          inits: [relaxs1[index1].toString(), relaxs2[index2].toString()],
          updates: [relaxs1[index1], relaxs2[index2]],
          upper_cover: [],
          lower_cover: []
        });

        if (index1 < relaxs1.length){
          index1++;
          node_map.set(index1 + '_' + index2, {
            id: id, 
            name: base_name + '_' + format(relaxs1[index1]) + '_' + format(relaxs2[index2]),
            inits: [relaxs1[index1].toString(), relaxs2[index2].toString()],
            updates: [relaxs1[index1], relaxs2[index2]],
            upper_cover: [],
            lower_cover: []
          });
          index1--;
        }

        if (index2 < relaxs2.length){
          index2++;
          node_map.set(index1 + '_' + index2, {
            id: id, 
            name: base_name + '_' + format(relaxs1[index1]) + '_' + format(relaxs2[index2]),
            inits: [relaxs1[index1].toString(), relaxs2[index2].toString()],
            updates: [relaxs1[index1], relaxs2[index2]],
            upper_cover: [],
            lower_cover: []
          });
          index2--;
        }

        index1++;
        index2++;
      }

      node_map.forEach((value, key) => {

        let i1 = parseInt(key.split('_')[0]);
        let i2 = parseInt(key.split('_')[0]);

        let k = (i1-1) + '_' + i2;
        let n = node_map.get(k);
        if (n){
          value.lower_cover.push(n.id)
        }

        k = (i1) + '_' + (i2-1);
        n = node_map.get(k);
        if (n){
          value.lower_cover.push(n.id)
        }

        k = (i1+1) + '_' + (i2);
        n = node_map.get(k);
        if (n){
          value.upper_cover.push(n.id)
        }

        k = (i1) + '_' + (i2+1);
        n = node_map.get(k);
        if (n){
          value.upper_cover.push(n.id)
        }

        nodes.push(value);
      })

      return nodes;
    }

    console.log("More than 2 relaxation not supported.");
    return [];
  }

  export function getAdditionalUpdates(possibleUpdates: PossibleInitFactUpdates[]): FactUpdate[] {
    console.log("getAdditionalUpdates");
    if (possibleUpdates.length == 1) {
      let max_relax = possibleUpdates[0].updates[possibleUpdates[0].updates.length - 1];
      return [new FactUpdate(Fact.fromObject(possibleUpdates[0].orgFact.fact), Fact.fromObject(max_relax.fact))];
    }
    return [];
  }