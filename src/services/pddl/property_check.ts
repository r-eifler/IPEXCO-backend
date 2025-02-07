import { DemoModel } from "../../db_schema/demo";
import { IterationStep, PlanRunStatus, StepStatus } from "../../db_schema/iteration_step";
import { PlanProperty, PlanPropertyModel } from "../../db_schema/plan-properties/plan_property";
import { Project, ProjectModel } from "../../db_schema/project";
import { PropertyCheckerRequest } from "../../db_schema/service_communication";
import { Service, ServiceModel, ServiceType } from "../../db_schema/services";
import { callServices } from "../utils";


export async function checkProperties(iterationStep: IterationStep) {

    console.log('Check which properties are satisfied...')

    if(iterationStep.plan?.status != PlanRunStatus.plan_found_not_checked || 
        !iterationStep.plan ||
        !iterationStep.plan.actions
    ){
        console.log('[Property Check] Step has no valid plan.')
        console.log(iterationStep.plan);
        iterationStep.status = StepStatus.unknown;
        if(iterationStep.plan){
            iterationStep.plan.status = PlanRunStatus.failed;
            iterationStep.plan.actions = undefined;
        }
        await iterationStep.save();
        return
    }

    const baseURL = process.env.BASE_URL || 'http://host.docker.internal:3000'

    const plan_properties = (await PlanPropertyModel.find({ project: iterationStep.project}) as PlanProperty[]).
    filter(pp => pp._id && (iterationStep.hardGoals.includes(pp._id) || iterationStep.softGoals.includes(pp._id)));

    let payload: PropertyCheckerRequest = {
        callback: baseURL + '/api/planner/plan-step/checked/' + iterationStep._id,
        id: iterationStep._id,
        model: JSON.parse(iterationStep.task.model as string), //TODO should  not necessary,
        goals: plan_properties,
        actions: iterationStep.plan?.actions
    }

    let project = await ProjectModel.findById(iterationStep.project) as Project;
    if(!project){
        project = await DemoModel.findById(iterationStep.project) as Project;
    }

    if (!project) {
        console.log('[Property Check] Project does not exist.')
        iterationStep.status = StepStatus.unknown;
        iterationStep.plan.status = PlanRunStatus.failed;
        iterationStep.plan.actions = undefined;
        await iterationStep.save();
        return;
    }

    const services: Service[] = [];
    for(const serviceId of project.settings.services.services) {
        const service = await ServiceModel.findById(serviceId);
        if(service && service.type == ServiceType.PROPERTY_CHECKER){
            services.push(service);
        }
    }

    if (services.length === 0) {
        console.log('[Property Check] No property checker service selected.')
        iterationStep.status = StepStatus.unknown;
        iterationStep.plan.status = PlanRunStatus.failed;
        iterationStep.plan.actions = undefined;
        await iterationStep.save();
        return;
    }

    const success = await callServices(services, JSON.stringify(payload), '/check');
    if(!success){
        iterationStep.status = StepStatus.unknown;
        iterationStep.plan.status = PlanRunStatus.failed;
        iterationStep.plan.actions = undefined;
        await iterationStep.save();
        console.log('[Property Check] No selected planner service reachable.')
        return
    }         

}