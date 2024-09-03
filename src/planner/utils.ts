import { GoalType, PlanProperty } from '../db_schema/plan-properties/plan_property';


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
  


  