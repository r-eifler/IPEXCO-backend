import {
  literal,
  nativeEnum,
  object,
  string,
  union,
  infer as zinfer,
} from "zod";

export enum BelugaActionType {
    UNLOAD_BELUGA = "unload_beluga",
    LOAD_BELUGA = "load_beluga",
    PUT_DOWN_RACK = "put_down_rack",
    PICK_UP_RACK = "pick_up_rack",
    DELIVER_TO_HANGAR = "deliver_to_hangar",
    GET_FROM_HANGAR = "get_from_hangar",
    SWITCH_TO_NEXT_BELUGA = "switch_to_next_beluga"
}

export const ServiceTypeZ = nativeEnum(BelugaActionType);

export const JigActionZ = object({
    j: string(),
});

export type JigAction = zinfer<typeof JigActionZ>;

export const RackActionZ = object({
    r: string(),
});

export type RackAction = zinfer<typeof RackActionZ>;

export const SideActionZ = object({
    s: string(),
});

export type SideAction = zinfer<typeof SideActionZ>;

export const UnloadBelugaZ = object({
    name: literal(BelugaActionType.UNLOAD_BELUGA),
    j: string(),
    b: string(),
    t: string(),
});

export type UnloadBeluga = zinfer<typeof UnloadBelugaZ>;

export const LoadBelugaZ = object({
    name: literal(BelugaActionType.LOAD_BELUGA),
    j: string(),
    b: string(),
    t: string(),
});

export type LoadBeluga = zinfer<typeof LoadBelugaZ>;

export const PutDownRackZ = object({
  name: literal(BelugaActionType.PUT_DOWN_RACK),
  j: string(),
  t: string(),
  r: string(),
  s: union([literal('fside'), literal('bside')]),
});

export type PutDownRack = zinfer<typeof PutDownRackZ>;

export const PickUpRackZ = object({
    name: literal(BelugaActionType.PICK_UP_RACK),
    j: string(),
    t: string(),
    r: string(),
    s: union([literal('fside'), literal('bside')]),
});

export type PickUpRack = zinfer<typeof PickUpRackZ>;

export const DeliverToHangerZ = object({
    name: literal(BelugaActionType.DELIVER_TO_HANGAR),
    j: string(),
    h: string(),
    t: string(),
    pl: string()
});

export type DeliverToHanger = zinfer<typeof DeliverToHangerZ>;

export const GetFromHangerZ = object({
    name: literal(BelugaActionType.GET_FROM_HANGAR),
    j: string(),
    h: string(),
    t: string(),
});

export type GetFromHanger = zinfer<typeof GetFromHangerZ>;

export const SwitchBelugaZ = object({
    name: literal(BelugaActionType.SWITCH_TO_NEXT_BELUGA),
});

export type SwitchBeluga = zinfer<typeof SwitchBelugaZ>;

export const BelugaActionZ = union([
    UnloadBelugaZ,
    LoadBelugaZ,
    PickUpRackZ,
    PutDownRackZ,
    DeliverToHangerZ,
    GetFromHangerZ,
    SwitchBelugaZ
])

export type BelugaAction = zinfer<typeof BelugaActionZ>;
