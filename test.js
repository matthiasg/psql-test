var pg = require('pg');
var faker = require('faker');
var Promise = require('bluebird');
var uuid = require('node-uuid');

// create a config to configure both pooling behavior
// and client options
// note: all config is optional and the environment variables
// will be read if the config is not present
var config = {
  user: 'postgres', //env var: PGUSER
  database: 'iris', //env var: PGDATABASE
  password: 'mx49ag', //env var: PGPASSWORD
  port: 5432, //env var: PGPORT
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};


//this initializes a connection pool
//it will keep idle connections open for a 30 seconds
//and set a limit of maximum 10 idle clients
var pool = new pg.Pool(config);

// to run a query we can acquire a client from the pool,
// run a query on the client, and then return the client to the pool
pool.connect(function(err, client, done) {
  if(err) {
    return console.error('error fetching client from pool', err);
  }

  setupTestData(pool);

  // pool
  //   .query('CREATE TABLE IF NOT EXISTS docs (id nvarchar(512)) ')
  //   .then( ()=> pool.query('INSERT INTO docs (id) VALUES (\'test\') ') )

  // client.query('SELECT $1::int AS number', ['1'], function(err, result) {
  //   //call `done()` to release the client back to the pool
  //   done();

  //   if(err) {
  //     return console.error('error running query', err);
  //   }
  //   console.log(result.rows[0].number);
  //   //output: 1
  //});
});

pool.on('error', function (err, client) {
  // if an error is encountered by a client while it sits idle in the pool
  // the pool itself will emit an error event with both the error and
  // the client which emitted the original error
  // this is a rare occurrence but can happen if there is a network partition
  // between your application and the database, the database restarts, etc.
  // and so you might want to handle it and at least log it out
  console.error('idle client error', err.message, err.stack)
})

// TEST database

function setupTestData(pool){

  var case_1 = createTestTable( pool, { name:'TEST_CASE', major:1 } );
  var product_1 = createTestTable( pool, { name:'TEST_PRODUCT', major:1 } );
  var product_2 = createTestTable( pool, { name:'TEST_PRODUCT', major:2 } );
  var company_1 = createTestTable( pool, { name:'TEST_COMPANY', major:1 } );

  return Promise.all( [case_1, product_1, product_2,company_1] ).spread( (case1,prod1,prod2,comp1)=>{

    return insertTestData( pool, comp1 ).then( (companyIds)=>{      
      return Promise.all([
        insertTestDataWithRefs( pool, prod1, companyIds),
        insertTestDataWithRefs( pool, prod2, companyIds)
      ]).spread((prod1ids,prod2ids)=>{
        const refids = prod1ids.concat(prod2ids);
        return insertTestDataWithRefs(pool, case1, refids);
      }).then( ()=>[case1,prod1,prod2,comp1] );
  })
    
  }).then( (tables)=>{ dropTables(pool, tables)} )
  .catch((error)=>{
    console.log('ERROR', error, error.stack);
  });
}

function createTestTable( pool, info ){
  var table = { name: info.name + '_' + info.major };

  var op = pool.query(`CREATE TABLE IF NOT EXISTS ${table.name}
              (
                id        varchar(128) NOT NULL,
                name      varchar(512),
                number    double precision,
                text      text,
                data_ref  varchar(128),
                data_refs  varchar(128)[],
                PRIMARY KEY (id)
                )`)

   return op.then( ()=>table );
}

function dropTables(pool,tables){
  return;
  console.log('dropping', tables)
  return Promise.each( tables, (table)=>pool.query(`DROP TABLE ${table.name} `) );
}


function insertTestData(pool,table){
  var number = 100;
  var ids = [];

  return Promise.each( new Array(number) , ()=>{
    const id = uuid.v1();
    ids.push(id);

    const q = {
      text: `INSERT INTO ${table.name}
              (id,name,number,text)
            VALUES ($1,$2,$3,$4)`,
      values:[id,faker.name.lastName(), faker.random.number(),faker.lorem.paragraph()]
    };

    // console.log(q)
    return pool.query(q);
  }).then( ()=>ids );
}


function insertTestDataWithRefs(pool,table, targetIds){

  console.log('insertTestDataWithRefs', targetIds);
  var number = 100;
  var ids = [];

  return Promise.each( new Array(number) , ()=>{
    const id = uuid.v1();
    ids.push(id);

    const randomRef = randomOf(targetIds);
    
    const q = {
      text: `INSERT INTO ${table.name}
              (id,name,number,text, data_ref)
            VALUES ($1,$2,$3,$4,$5)`,
             values:[id,faker.name.lastName(), faker.random.number(),faker.lorem.paragraph(),randomRef]
    };

    // console.log(q)
    return pool.query(q);
  }).then( ()=>ids);
}

function randomOf( list ){
  var i = Math.floor( Math.random()*list.length );
  //console.log(i)
  return list[ i ];
}
