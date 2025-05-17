import { SimplePlanProperty } from "../plan-properties/plan_property";
import { BelugaConfiguration } from "./flight-section-tree";
import { SiteStatus } from "./site_set_up";

export function filterUpTo(collection: string[], considered: Set<string>){
    let res: string[] = [];
    for(let s of collection){
        if(considered.has(s)){
            res.push(s)
        }
        else{
            break;
        }
    }
    return res;
}

export function filterUpToFun<T>(collection: T[], filter: (v: T) => boolean){
    let res: T[] = [];
    for(let s of collection){
        if(filter(s)){
            res.push(s)
        }
        else{
            break;
        }
    }
    return res;
}

export enum BelugaGoalType {
    NUM_SWAPS_USED_LEQ = "num_swaps_used_leq",
    AT_LEAST_ONE_RACK_ALWAYS_EMPTY = "at_least_one_rack_always_empty",
    LOAD_BELUGA = "load_beluga",
    UNLOAD_BELUGA = "unload_beluga",
    DELIVER_TO_PRODUCTION_LINE = "deliver_to_production_line",
    RACK_MAINTENANCE = "rack_maintenance",
    TRAILER_MAINTENANCE = "trailer_maintenance" 
}

export function generateSoftGoals(configuration: BelugaConfiguration){

    const goals: SimplePlanProperty[] = []
    
    if(configuration.maxSwaps !== null){
        let swapsGoal: SimplePlanProperty = {
            _id: 'swaps_' + configuration.maxSwaps.toString(),
            name: "maximal number of swaps",
            definition: {
            name: BelugaGoalType.NUM_SWAPS_USED_LEQ,
            parameters: [configuration.maxSwaps.toString()]
            }
        } 
        goals.push(swapsGoal)
    }

    if(configuration.minEmptyRacks !== null && configuration.minEmptyRacks > 0){
        let swapsGoal: SimplePlanProperty = {
            _id: 'keep_rack_empty',
            name: "at least one rack empty",
            definition: {
            name: BelugaGoalType.AT_LEAST_ONE_RACK_ALWAYS_EMPTY,
            parameters: []
            }
        } 
        goals.push(swapsGoal)
    }

   configuration.flightTargetSchedule.outgoing.filter(e => !e.skip).forEach((e, index) => {
        let swapsGoal: SimplePlanProperty = {
            _id: 'load_' + e.jigType + '_' + index + '_' + configuration.flightTargetSchedule.name,
            name: "load beluga",
            definition: {
            name: BelugaGoalType.LOAD_BELUGA,
            parameters: [
                e.jigType,
                configuration.flightTargetSchedule.name,
                index.toString()
            ]
            }
        } 
        goals.push(swapsGoal)
    })

    configuration.flightTargetSchedule.incoming.filter(e => !e.skip).forEach((e, index) => {
        let swapsGoal: SimplePlanProperty = {
            _id: 'unload' + e.jig + '_' + index + '_' + configuration.flightTargetSchedule.name,
            name: "unload beluga",
            definition: {
            name: BelugaGoalType.UNLOAD_BELUGA,
            parameters: [
                e.jig,
                configuration.flightTargetSchedule.name,
                index.toString()
            ]
            }
        } 
        goals.push(swapsGoal)
    })
    
    configuration.productionLinesTargetSchedule.forEach(pl => pl.schedule.filter(e => !e.skip).forEach((e, index) => {
        let swapsGoal: SimplePlanProperty = {
            _id: 'deliver' + e.jig + '_' + index + '_' + pl.name,
            name: "deliver to production line beluga",
            definition: {
            name: BelugaGoalType.DELIVER_TO_PRODUCTION_LINE,
            parameters: [
                e.jig,
                pl.name,
                index.toString()
            ]
            }
        } 
        goals.push(swapsGoal)
    }))

    // Maintenance racks or trailer
    configuration.siteSetUp.racks.filter(r => r.status == SiteStatus.MAINTENANCE).forEach(r => {
        let goal: SimplePlanProperty = {
            _id: 'maintenance_' + r.name,
            name: r.name + "in maintenance",
            definition: {
            name: BelugaGoalType.RACK_MAINTENANCE,
            parameters: [
                r.name
            ]
            }
        } 
        goals.push(goal)
    });

    [...configuration.siteSetUp.belugaTrailers,...configuration.siteSetUp.factoryTrailers].
    filter(t => t.status == SiteStatus.MAINTENANCE).
    forEach(t => {
        let goal: SimplePlanProperty = {
            _id: 'maintenance_' + t.name,
            name: t.name + "in maintenance",
            definition: {
            name: BelugaGoalType.TRAILER_MAINTENANCE,
            parameters: [
                t.name
            ]
            }
        } 
        goals.push(goal)
    });

    return goals
}