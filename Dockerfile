FROM hypriot/rpi-node

RUN mkdir -p /usr/src/kettle-api
WORKDIR /usr/src/kettle-api
COPY . /usr/src/kettle-api

EXPOSE 8080
CMD [ "npm", "start" ]

