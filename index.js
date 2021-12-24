// The entrypoint is here !
const Gitrows = require('gitrows');

// Init the GitRows client, you can provide options at this point, later or just run on the defaults
const gitrows = new Gitrows();

let path = '@github/gitrows/data/iris.json';

gitrows.get(path).then( (data) => {
  //handle (Array/Object)data
  console.log(data);
 }).catch((error) => {
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
});

