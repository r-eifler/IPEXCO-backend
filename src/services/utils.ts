import { resolve } from "path";
import { Service } from "../db_schema/services";

export async function callServices(services: Service[], payload: string, path: string): Promise<boolean> {

    let atLeastOneSuccessfulSubmission = false;

    for(const service of services){

        // console.log(service);

        const request = new Request(service.url + path, 
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    authorization: "Bearer " + service.apiKey
                },
                body: payload,
            }
        );

        const resp = await fetch(request);
        console.log("Request submitted: " + service.name);
        // console.log(resp);
        atLeastOneSuccessfulSubmission = resp.status >= 200 && resp.status < 300;
    }

    console.log('Planner service reached: ' + atLeastOneSuccessfulSubmission);
    return atLeastOneSuccessfulSubmission;
}