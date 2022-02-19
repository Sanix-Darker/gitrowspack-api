// The entrypoint is here !
// gitrows support .json|.csv|.yaml

// We set the dotenv
const dotenv = require('dotenv');
// We instantiate our gitrows
const Gitrows = require('./gitrows');
// We call express
const express = require('express')

dotenv.config();
const app = express()
const port = `${process.env.PORT}`
const version = `${process.env.VERSION}`
const EXTENSION = `json` // yaml, csv, json


const options = {
  token: `${process.env.GITHUB_TOKEN}`,
  owner: `${process.env.GITHUB_OWNER}`,
  csv: { delimiter: ',' },
  cacheTTL: 7000, // You can tweak this value to have a custom cache validity time (3s here)
  type: EXTENSION,
}

const getPath = (req, ns='github') => {
    const formatExtension = req.query.format ? req.query.format : EXTENSION;
    return `@${ns}/${process.env.GITHUB_OWNER}/${req.params.project}/${req.params.database}/${req.params.collection}.${formatExtension}`
}

const gitrows = new Gitrows(options);
const BASE_ROUTE = '/api/v1';

app.use(express.json());


// get with filters
// get all elements
// curl -X POST -H 'content-type: application/json' http://127.0.0.1:3030/api/v1/data/d
// curl -X POST -H 'content-type: application/json' -d '{"filter": {"key": "1"}}' http://127.0.0.1:3030/api/v1/get/data/d/o
app.post(`${BASE_ROUTE}/get/:project/:database/:collection`, async (req, res) => {
    const filter = req.body["filter"];

    const data = await gitrows.get(
        getPath(req),
        filter
    );
    res.setHeader('Content-Type', 'application/json');
    res.json(data)
})


// Now we can put elements
// curl -X POST -H 'content-type: application/json' -d '{"data": {"key": "0001"}}' http://127.0.0.1:3030/api/v1/put/data/d/o
app.post(`${BASE_ROUTE}/put/:project/:database/:collection`, async (req, res) => {
    const dataToInsert = req.body["data"];

    const data = await gitrows.put(
        getPath(req),
        dataToInsert
    );
    res.setHeader('Content-Type', 'application/json');
    res.json(data)
})

// Now we can update existing elements
// curl -X POST -H 'content-type: application/json' -d '{"data": {"value": "new"}, "filter": {"key": "ooo1"}}}' /api/v1/update/data/d/o
app.post(`${BASE_ROUTE}/update/:project/:database/:collection`, async (req, res) => {
    const filter = req.body["filter"];
    const dataToInsert = req.body["data"];

    const data = await gitrows.update(
        getPath(req),
        dataToInsert,
        filter
    );
    res.setHeader('Content-Type', 'application/json');
    res.json(data)
})

// Now we can replace the whole collection
// curl -X POST -H 'content-type: application/json' -d '{"data": [ {"key": "o9o1",  "value": "new"} ]' /api/v1/replace/data/d/o
app.post(`${BASE_ROUTE}/replace/:project/:database/:collection`, async (req, res) => {
    const dataToInsert = req.body["data"];

    const data = await gitrows.replace(
        getPath(req),
        dataToInsert,
    );
    res.setHeader('Content-Type', 'application/json');
    res.json(data)
})


// Now we can delete existing elements
// curl -X POST -H 'content-type: application/json' -d '{"filter": {"key": "ooo1"}}}' /api/v1/delete/data/d/o
app.post(`${BASE_ROUTE}/delete/:project/:database/:collection`, async (req, res) => {
    const filter = req.body["filter"];

    const data = await gitrows.delete(
        getPath(req),
        filter
    );
    res.setHeader('Content-Type', 'application/json');
    res.json(data)
})

// Now we can create a new collection
// curl -X POST -H 'content-type: application/json' /api/v1/create/data/d2/o
app.post(`${BASE_ROUTE}/create/:project/:database/:collection`, async (req, res) => {

    const data = await gitrows.create(
        getPath(req)
    );
    res.setHeader('Content-Type', 'application/json');
    res.json(data)
})

// Now we can drop a whole collection
// curl -X POST -H 'content-type: application/json' /api/v1/drop/data/d2/o
app.post(`${BASE_ROUTE}/drop/:project/:database/:collection`, async (req, res) => {

    const data = await gitrows.drop(
        getPath(req)
    );
    res.setHeader('Content-Type', 'application/json');
    res.json(data)
})


// Some cli endpoints for checking
// -------------------------------
//
// A simple ping for checking if the service is up
// curl /api/v1/ping
app.get(`${BASE_ROUTE}/ping`, async (req, res) => {
    const data = {
        "status": "success",
        "server-ip": req.hostname,
        "version": `GitRowsPack-Api-${version}`,
        "message": `Welcome to the GitRowsPack shell. For interactive help, type "help". For more comprehensive documentation, see https://github.com/Sanix-Darker/gitrowspack-api`
    }
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
});

// A simple endpoint to get the list of databases
// curl /api/v1/databases
app.get(`${BASE_ROUTE}/:project/databases`, async (req, res) => {
    const data = {
        "project": req.params.project,
        "databases": await gitrows.getDatabases(req.params.project)
    }
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
});

// A simple endpoint to get the list of databases
// curl /api/v1/collections
app.get(`${BASE_ROUTE}/:project/:database/collections`, async (req, res) => {
    const data = {
        "project": req.params.project,
        "database": req.params.database,
        "collections": await gitrows.getCollections(req.params.project, req.params.database)
    }
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
});


app.listen(port, () => {
    console.log('-------------------------------------------------------')
    console.log(`GitRowsPack-Api-${version} started at http://localhost:${port}`)
})
