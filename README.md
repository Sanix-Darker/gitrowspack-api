# GitRowsPack-Api

GRP is a service interface for your (github/gitlab) repository oriented for Database (NoSQL)!
Basically, you can stored data on a repository and with this running service as the backend to access it.

It support *json*, *csv* and *yaml* file, but as default, we will be using the json.

The purpose of this project is to have a full quick running gitrows's api instance if we have our own private repos that we want to transform as storage !

![screen](./screen.gif)

## DISCLAIMERS

This project is for certain usecases... the github API cache is HUGE, like 4/5mins, so this it's not a realtime stuff, you can use in your project.
But it does the job for data that is not going to change MORE often!

**This is a node-rest-api service inspired from an amazing npm package [gitrows](https://www.npmjs.com/package/gitrows) made by [Nicolas-Zimmer](https://github.com/nicolaszimmer) long time ago !**

- **__With Code improvements and some bugs fixes (due to github/gitlab api changes) !__**
- **__With CI and running tests to ensure we have everything working on new releases !__**

## REQUIREMENTS

- node/npm (see the package.json for deps...)
- DOCKER (optionnal)

## HOW TO SET UP

- Create a repository in your _github/gitlab_ profile, you can call it *'data'* for example(see mine here : https://github.com/sanix-Darker/data).
- Each directory in your project will be a *'database'* and inside, each *.json, *.csv, *.yaml is a database collection.

- Follow those steps:
```bash
cd to/a/random/dir
# get the environment sample file:
wget -o .env \
https://raw.githubusercontent.com/Sanix-Darker/gitrowspack-api/master/.env.example

# or you can clone the project and do a copy
# cp .env.example .env

# and provide valids parameters inside
# GITHUB_OWNER is your github username
# GITHUB_TOKEN is a github access token you can create from your settings easily: https://github.com/settings/tokens

# And you're all set :-)
```

## HOW TO START IT

### USING THE DOCKER IMAGE

![docker-screen](./docker-screen.png)

```bash
# This will pull an image of gitrowspack and start it
docker run \
--env-file .env \
-it --rm \
-p 3030:3030 \
sanixdarker/gitrowspack-api:latest

# expected output
# Unable to find image 'sanixdarker/gitrowspack-api:0.0.1' locally
# 0.0.1: Pulling from sanixdarker/gitrowspack-api
# 482c96fb3fd1: Already exists
# 8a46b85b8b61: Pull complete
# 1a99571c09c9: Pull complete
# e7276d16c1c3: Pull complete
# 1d5b7776a505: Pull complete
# Digest: sha256:72dbcfa96ca59ad684c62dfe3e72b2d35e6c5a7e0024c5331b005f36be122d72
# Status: Downloaded newer image for sanixdarker/gitrowspack-api:0.0.1
# GitRowsPack-Api started at http://localhost:3030

# Now you can test it out
# To list available databases (note that the repo needed to be created first)
# curl http://127.0.0.1:3030/api/v1/<repo-name>/databases

# And the collection is a directory
# curl http://127.0.0.1:3030/api/v1/<repo-name>/<database-name>/collections
```

### BUILD YOUR OWN IMAGE

```bash
# You can build the image locally yourself
docker build --no-cache -t sanixdarker/gitrowspack-api:0.0.1 -f Dockerfile .
# And then run it locally with a valid .env
docker run --env-file .env --rm -p 3030:3030 sanixdarker/gitrowspack-api:0.0.1
```

### NO DOCKER INVOLVES

```bash
npm install
npm start # node index.js
```

## API DOCUMENTATION

You can check the API-Documentation [HERE](https://documenter.getpostman.com/view/2696027/UVREijCS)
Under a [MIT](LICENSE).


## AUTHOR

- [dk](https://github.com/sanix-darker)
