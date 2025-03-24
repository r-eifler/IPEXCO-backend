FROM ubuntu:noble
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install python3 -y
RUN apt-get install -y python3-pip
RUN python3 -m pip install setuptools --break-system-packages
RUN python3 -m pip install unified-planning --break-system-packages

# demo builder and plan-property plan checker
COPY utils/ /usr/src/utils

#install Node.js
RUN apt-get update
RUN apt-get install curl -y
RUN curl -sL https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install -y nodejs

#copy app bin
RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN rm -rf node_modules
RUN npm install
RUN npm install -g typescript

# persistent storage
RUN mkdir -p  /usr/src/app/dist/out-tsc/data
VOLUME /usr/src/app/dist/out-tsc/data

# environment
ENV UPLOADPATH=/usr/src/app/dist/out-tsc/data/uploads

# run
EXPOSE 3000

WORKDIR /usr/src/app
CMD tsc; node dist/out-tsc/app.js
