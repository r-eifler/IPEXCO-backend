import { BelugaAction, BelugaActionType, DeliverToHangerZ, GetFromHangerZ, LoadBelugaZ, PickUpRackZ, PutDownRackZ, UnloadBelugaZ } from "./beluga_plan";
import { BelugaProblem, Flight, getJigSize, getRackSize, Jig, JigZ, occupiedRackSpace, occupiedSpace, ProductionLine, ProductionLineZ } from "./beluga_problem";
import { array, boolean, nullable, number, object, optional, record, string, infer as zinfer } from "zod";
import { BelugaSiteSetUp } from "./site_set_up";

export const BelugaStateZ = object({
    jigs: record(string(), JigZ),
    flightIndex: number(),
    incomingUnloaded: array(string()),
    outgoingLoaded: array(string()),
    racks: record(string(),  array(string())),
    trailers: record(string(),  nullable(string())),
    hangars: record(string(),  nullable(string())),
    productionLines: record(string(),  array(string())),
})

export type BelugaState = zinfer<typeof BelugaStateZ>;

export function getInitialState(model: BelugaProblem): BelugaState {
    const trailers = model.trailers_beluga.reduce((acc,c) => ({...acc, [c.name]: c.jig}), {})
    model.trailers_factory.reduce((acc,c) => ({...acc, [c.name]: null}), trailers)
    return {
        jigs: model.jigs,
        flightIndex: 0,
        incomingUnloaded: [],
        outgoingLoaded: [],
        trailers,
        racks: model.racks.reduce((acc,c) => ({...acc, [c.name]: [...c.jigs]}), {}),
        hangars: model.hangars.reduce((acc,c) => ({...acc, [c.name]: c.jig}), {}),
        productionLines: model.production_lines.reduce((acc,c) => ({...acc,[c.name]: []}), {})
      }
}

export function isApplicable(state: BelugaState, action: BelugaAction, flights: Flight[], productionSchedule: ProductionLine[], siteSetUp: BelugaSiteSetUp): boolean{
    switch(action.name){
        case BelugaActionType.SWITCH_TO_NEXT_BELUGA:
            return state.incomingUnloaded.length == flights[state.flightIndex].incoming.length && 
                state.outgoingLoaded.length == flights[state.flightIndex].outgoing.length
        case BelugaActionType.DELIVER_TO_HANGAR:
            let da = DeliverToHangerZ.parse(action);
            return state.hangars[da.h] == null && 
                state.trailers[da.t] == da.j &&
                ! state.jigs[da.j].empty &&
                productionSchedule.find(pl => pl.name == da.pl)?.schedule[state.productionLines[da.pl].length] == da.j
        case BelugaActionType.GET_FROM_HANGAR:
            let ga = GetFromHangerZ.parse(action);
            return state.hangars[ga.h] == ga.j && 
            state.trailers[ga.t] == null 
        case BelugaActionType.LOAD_BELUGA:
            let lba = LoadBelugaZ.parse(action);
            return state.trailers[lba.t] == lba.j &&
                state.outgoingLoaded.length <flights[state.flightIndex].outgoing.length &&
                flights[state.flightIndex].outgoing[state.outgoingLoaded.length] == state.jigs[lba.j].type
        case BelugaActionType.UNLOAD_BELUGA:
            let uba = UnloadBelugaZ.parse(action);
            return state.incomingUnloaded.length < flights[state.flightIndex].incoming.length && 
                flights[state.flightIndex].incoming[state.incomingUnloaded.length] == uba.j &&
                state.trailers[uba.t] == null 
        case BelugaActionType.PICK_UP_RACK:
            let pua = PickUpRackZ.parse(action);
            if(pua.s === 'bside'){
                return state.racks[pua.r].length > 0 && 
                    state.racks[pua.r][0] == pua.j &&
                    state.trailers[pua.t] == null
            }
            else{
                return state.racks[pua.r].length > 0 && 
                    state.racks[pua.r][state.racks[pua.r].length-1] == pua.j &&
                    state.trailers[pua.t] == null
            }
        case BelugaActionType.PUT_DOWN_RACK:
            let pda = PutDownRackZ.parse(action);
            let rackSize = getRackSize(pda.r, siteSetUp);
            let jig_size = getJigSize( state.jigs[pda.j], siteSetUp.jig_types[state.jigs[pda.j].type])
            if(pda.s === 'bside'){
                return rackSize !== undefined && 
                rackSize - occupiedRackSpace(state.racks[pda.r], state.jigs, siteSetUp.jig_types) >= jig_size &&
                state.trailers[pda.t] == pda.j
            }
            else{
                return rackSize !== undefined && 
                rackSize - occupiedRackSpace(state.racks[pda.r], state.jigs, siteSetUp.jig_types) >= jig_size &&
                state.trailers[pda.t] == pda.j
            }        
    }
}


export function applyAction(state: BelugaState, action: BelugaAction, flights: Flight[], productionSchedule: ProductionLine[], siteSetUp: BelugaSiteSetUp): BelugaState | undefined{
    if(!isApplicable(state, action, flights, productionSchedule, siteSetUp)){
        console.log("Action: " + action.name + " is not applicable!")
        return undefined;
    }
    switch(action.name){
        case BelugaActionType.SWITCH_TO_NEXT_BELUGA:
            return {
                ...state,
                flightIndex: state.flightIndex + 1,
                outgoingLoaded: [],
                incomingUnloaded: []
            }
        case BelugaActionType.DELIVER_TO_HANGAR:
            let da = DeliverToHangerZ.parse(action);
            return {
                ...state,
                trailers: {...state.trailers, [da.t]: null},
                hangars: {...state.hangars, [da.h]: da.j},
                jigs: {...state.jigs, [da.j]: {...state.jigs[da.j], empty: true}},
                productionLines: {...state.productionLines, [da.pl]: 
                    [...state.productionLines[da.pl], da.j]
                }

            }
        case BelugaActionType.GET_FROM_HANGAR:
            let ga = GetFromHangerZ.parse(action);
            return {
                ...state,
                trailers: {...state.trailers, [ga.t]: ga.j},
                hangars: {...state.hangars, [ga.h]: null}
            }
        case BelugaActionType.LOAD_BELUGA:
            let lba = LoadBelugaZ.parse(action);
            return {
                ...state,
                outgoingLoaded: [...state.outgoingLoaded, lba.j], 
                trailers: {...state.trailers, [lba.t]: null},
            }
        case BelugaActionType.UNLOAD_BELUGA:
            let uba = UnloadBelugaZ.parse(action);
            return {
                ...state,
                incomingUnloaded: [...state.incomingUnloaded, uba.j], 
                trailers: {...state.trailers, [uba.t]: uba.j},
            }
        case BelugaActionType.PICK_UP_RACK:
            let pua = PickUpRackZ.parse(action);
            if(pua.s === 'bside'){
                return {
                    ...state,
                    racks: {...state.racks, [pua.r]: state.racks[pua.r].filter(j => j !== pua.j)}, 
                    trailers: {...state.trailers, [pua.t]: pua.j},
                }
            }
            else{
                return {
                    ...state,
                    racks: {...state.racks, [pua.r]: state.racks[pua.r].filter(j => j !== pua.j)}, 
                    trailers: {...state.trailers, [pua.t]: pua.j},
                }
            }
        case BelugaActionType.PUT_DOWN_RACK:
            let pda = PutDownRackZ.parse(action);
            if(pda.s === 'bside'){
                return {
                    ...state,
                    racks: {...state.racks, [pda.r]: [pda.j, ...state.racks[pda.r]]}, 
                    trailers: {...state.trailers, [pda.t]: null},
                }
            }
            else{
                return { 
                    ...state,
                    racks: {...state.racks, [pda.r]: [...state.racks[pda.r],pda.j]}, 
                    trailers: {...state.trailers, [pda.t]: null},
                }
            }        
    }
}

export function applyActions(state: BelugaState | undefined, actions: BelugaAction[],  flights: Flight[], productionSchedule: ProductionLine[], siteSetUp: BelugaSiteSetUp) {
    let cs: BelugaState | undefined = state;
    for(let action of actions){
        if(cs == undefined){
            return undefined
        }
        cs = applyAction(cs,action, flights, productionSchedule, siteSetUp);
    }
    return cs
}