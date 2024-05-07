# IPEXCO - Iterative Planning Tool with Explanations of Conflicts - BACK END

## Setup

### Docker Images

1. Install [Docker](https://docs.docker.com/engine/install/)
1. Get Docker image of back end: `docker pull eifler/ipexco`
1. Get Docker image of mongoDB: `docker pull mongo`

### Environment

1. Get environment file `docker/docker.env`
1. Set server key

### Docker Compose

1. Get Docker compose file: `docker/docker-compose.yml` (same folder as environment file)
1. Set paths for data base and server data

### Run

`docker compose up --build`

## Docker

`https://hub.docker.com/r/eifler/ipexco`
