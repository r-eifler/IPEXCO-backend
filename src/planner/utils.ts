import { PPDependencies, PPConflict } from './../db_schema/explanations';
import { GoalType, PlanProperty } from '../db_schema/plan-properties/plan_property';

export function updateMUGSPropsNames(json: any, planProperties: PlanProperty[]): string[][] {
    const newMUGS = [];
    for (const mugs of json['MUGS']) {
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
  
  export function toConflicts(json: any, planProperties: PlanProperty[]): PPDependencies {
  
    const newMUGS = updateMUGSPropsNames(json, planProperties);
  
    let dep : PPDependencies = {conflicts: []};
  
    for (const mugs of newMUGS) {
        let conflict : PPConflict = {elems: []};
        for(const e of mugs){
            const pp = planProperties.find(pp => pp.name == e);
            if(pp && pp._id){
                conflict.elems.push(pp._id)
            }
        }
        dep.conflicts.push(conflict);
    }
    console.log(dep);
    return dep;
  }