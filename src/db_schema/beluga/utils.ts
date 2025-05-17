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

export function generateSoftGoals(configuration: BelugaConfiguration){

    const goals: SimplePlanProperty[] = []
    
    if(configuration.maxSwaps !== null){
        let swapsGoal: SimplePlanProperty = {
            _id: 'swaps_' + configuration.maxSwaps.toString(),
            name: "maximal number of swaps",
            definition: {
            name: "num_swaps_used_leq",
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
            name: "at_least_one_rack_always_empty",
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
            name: "load_beluga",
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
            name: "unload_beluga",
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
            name: "deliver_to_production_line",
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
            name: "rack_maintenance",
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
            name: "trailer_maintenance",
            parameters: [
                t.name
            ]
            }
        } 
        goals.push(goal)
    });

    return goals
}