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
  csv: { delimiter: ',' },
  cacheTTL: 7000, // You can tweak this value to have a custom cache validity time (3s here)
}

const getPath = (req, ns='github') => {
    return `@${ns}/${process.env.GITHUB_OWNER}/${req.params.database}/${req.params.collection}/o.${EXTENSION}`
}

const gitrows = new Gitrows(options);
const BASE_ROUTE = '/api/v1';

app.use(express.json());


// get with filters
// get all elements
// curl -X POST -H 'content-type: application/json' http://127.0.0.1:3030/api/v1/data/d
// curl -X POST -H 'content-type: application/json' -d '{"filter": {"key": "1"}}' http://127.0.0.1:3030/api/v1/get/data/d
app.post(`${BASE_ROUTE}/get/:database/:collection`, async (req, res) => {
    const filter = req.body["filter"];

    const data = await gitrows.get(
        getPath(req),
        filter
    );
    res.json(data)
})


// Now we can put elements
// curl -X POST -H 'content-type: application/json' -d '{"data": {"key": "0001"}}' http://127.0.0.1:3030/api/v1/put/data/d
app.post(`${BASE_ROUTE}/put/:database/:collection`, async (req, res) => {
    const dataToInsert = req.body["data"];

    const data = await gitrows.put(
        getPath(req),
        dataToInsert
    );
    res.json(data)
})

// Now we can update existing elements
// curl -X POST -H 'content-type: application/json' -d '{"data": {"value": "new"}, "filter": {"key": "ooo1"}}}' /api/v1/update/data/d
app.post(`${BASE_ROUTE}/update/:database/:collection`, async (req, res) => {
    const filter = req.body["filter"];
    const dataToInsert = req.body["data"];

    const data = await gitrows.update(
        getPath(req),
        dataToInsert,
        filter
    );
    res.json(data)
})

// Now we can replace the whole collection
// curl -X POST -H 'content-type: application/json' -d '{"data": [ {"key": "o9o1",  "value": "new"} ]' /api/v1/replace/data/d
app.post(`${BASE_ROUTE}/replace/:database/:collection`, async (req, res) => {
    const dataToInsert = req.body["data"];

    const data = await gitrows.replace(
        getPath(req),
        dataToInsert,
    );
    res.json(data)
})


// Now we can delete existing elements
// curl -X POST -H 'content-type: application/json' -d '{"filter": {"key": "ooo1"}}}' /api/v1/delete/data/d
app.post(`${BASE_ROUTE}/delete/:database/:collection`, async (req, res) => {
    const filter = req.body["filter"];

    const data = await gitrows.delete(
        getPath(req),
        filter
    );
    res.json(data)
})

// Now we can create a new collection
// curl -X POST -H 'content-type: application/json' /api/v1/create/data/d2
app.post(`${BASE_ROUTE}/create/:database/:collection`, async (req, res) => {

    const data = await gitrows.create(
        getPath(req)
    );
    res.json(data)
})

// Now we can drop a whole collection
// curl -X POST -H 'content-type: application/json' /api/v1/drop/data/d2
app.post(`${BASE_ROUTE}/drop/:database/:collection`, async (req, res) => {

    const data = await gitrows.drop(
        getPath(req)
    );
    res.json(data)
})


app.listen(port, () => {
    console.log('----------------------------------------------------')
    console.log(`GitRowsPack-Api-${version} started at http://localhost:${port}`)
})
