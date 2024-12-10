# IPEXCO - Iterative Planning Tool with Explanations of Conflicts - BACK END

## Setup

### Docker Images

1. Install [Docker](https://docs.docker.com/engine/install/)
1. Get Docker image ``docker pull` of 
    1. back end: `eifler/ipexco:latest`
    1. planner service: `eifler/planner-service:latest`
    1. explainer service: `eifler/explainer-service:latest`
    1. database: `mongo`

### Environment

1. update environment file `docker/backend.env`
    - Set server key `JWT_KEY`

### Docker Compose

1. Update Docker compose file: `docker/docker-compose.yml`
    - Set paths for database and server data

### Run

`docker compose up --build`

## Create Project

There are two sample domains/instances in the folder `docker/sample_instances`.

The following steps are needed to setup a project:

1. (If you are not registered, do so.)
2. Go to project and create a new project by uploading the `domain.pddl` and `problem.pddl` files.
3. Open the project and go to **setting**. In the bottom copy the content of the `templates_X.json` fields into the JSON tab of the templates and save it.
4. Go to the project overview and start *iterative planning*.
