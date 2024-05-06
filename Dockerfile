# This stage installs our modules
FROM node:22

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

CMD ["node","index.js"]
