# GitRowsPack-Api

This is a node-api inspired from an amazing npm package [gitrows](https://www.npmjs.com/package/gitrows) made by [Nicolas-Zimmer](https://github.com/nicolaszimmer) long time ago !

With a lot of improvements and fixes !

So, what's is gitrowspack-api in a simple sentence, it's a javascript interface for your (github/gitlab) repository oriented on NoSQLDatabase !

The purpose of this project is to have a full quick running gitrows's api instance if we have our own private repos that we want to transform as storage !


## Requirements
### For prod
To start quick and run the api.
- Docker

### For Dev
- node/npm
- Docker


## Features
-


## How to start it
## For prod
```bash
# create an .env file 
# and provide those parameters inside
PORT=3030
GITHUB_OWNER=sanix-darker
GITHUB_TOKEN=ghp_7asdasdsadsadsadasdsadsadsa


# Then run gitrowspack with docker run (it will pull the image from dockerhub)
docker run --env-file .env --rm -p 3030:3030 sanixdarker/gitrowspack-api:0.0.1
```

## For dev
```bash
# You can build the app yourself
docker build --no-cache -t sanixdarker/gitrowspack-api:0.0.1 -f Dockerfile .
# And then run it locally with a valid .env
docker run --env-file .env --rm -p 3030:3030 sanixdarker/gitrowspack-api:0.0.1


# Or just start it manually
npm install
npm start
```

## Author

- Sanix-darker

