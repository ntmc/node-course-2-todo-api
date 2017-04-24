//const mongoClient = require('mongodb').MongoClient;
const {MongoClient, ObjectID} = require('mongodb');

let obj = new ObjectID();

MongoClient.connect('mongodb://localhost:27017/TodoApp', (error, db) => {
  if (error) {
    return console.log('Unable to connect to MongoDB server', error);
  }
  console.log('Connected to MongoDB server');

  db.collection('Todos').insertOne({
    text: 'Something to do',
    completed: false
  }, (error, result) => {
    if (error) {
      return console.log('Unable to insert todo', error);
    }
    console.log(JSON.stringify(result.ops, undefined, 2));
  });

  db.collection('Users').insertOne({
    name: 'Aladdin',
    age: 20,
    location: 'Agrabah'
  }, (error, result) => {
    if (error) {
      return console.log('Unable to insert user', error);
    }
    console.log(JSON.stringify(result.ops, undefined, 2));
  });

  db.close();
});
