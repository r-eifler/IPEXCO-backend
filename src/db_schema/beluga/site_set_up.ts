import { array, boolean, nativeEnum, nullable, number, object, optional, record, string, infer as zinfer } from "zod";
import { BelugaProblem, JigTypeZ, JigZ } from "./beluga_problem";


export enum SiteStatus {
  IN_USE = "IN_USE",
  MAINTENANCE = "MAINTENANCE"
}

export const SiteStatusZ = nativeEnum(SiteStatus);

export const RackZ = object({
    name: string(),
    size: number(),
    status: SiteStatusZ,
});

export type Rack = zinfer<typeof RackZ>;

export const TrailerZ = object({
    name: string(),
    status: SiteStatusZ,
});

export type Trailer = zinfer<typeof TrailerZ>;

export const TrailerSetUpZ = object({
    
})

export const HangarZ = object({
    name: string(),
    status: SiteStatusZ,
});

export type Hangar = zinfer<typeof HangarZ>;


export const BelugaSiteSetUpZ = object({
    jig_types: record(string(),JigTypeZ),
    racks: array(RackZ),
    belugaTrailers: array(TrailerZ),
    factoryTrailers: array(TrailerZ),
    hangars: array(HangarZ),
})

export type BelugaSiteSetUp = zinfer<typeof BelugaSiteSetUpZ>;

export function getSiteSetUp(task: BelugaProblem){
    return {
        jig_types: task.jig_types,
        racks: task.racks.map(r => ({name: r.name, size: r.size, status: SiteStatus.IN_USE})),
        hangars: task.hangars.map(h => ({name: h.name, status: SiteStatus.IN_USE})),
        belugaTrailers: task.trailers_beluga.map(t => ({name: t.name, status: SiteStatus.IN_USE})),
        factoryTrailers: task.trailers_factory.map(t => ({name: t.name, status: SiteStatus.IN_USE})),
    }
}


export const BelugaSiteStateZ = object({
    jigs: record(string(), JigZ),
    racks: record(string(),  array(string())),
    trailers: record(string(),  nullable(string())),
    hangars: record(string(),  nullable(string())),
})

export type BelugaSiteState = zinfer<typeof BelugaSiteStateZ>;