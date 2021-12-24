# This stage installs our modules
FROM mhart/alpine-node:12
MAINTAINER s4nixd@gmail.com

WORKDIR /app
COPY package.json package-lock.json ./

RUN npm install

# Then we copy over the modules from above onto a `slim` image
FROM mhart/alpine-node:slim-12

RUN apk add --no-cache tini

WORKDIR /app
COPY --from=0 /app .
COPY . .

ENTRYPOINT ["/sbin/tini", "--"]

# Because npm is not installed here
# We will run with the node directly
CMD ["node","index.js"] 
