require('./config/config.js');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

const {mongoose} = require('./db/mongoose.js');
const {Todo} = require('./models/todo.js');
const {User} = require('./models/user.js');

let app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', (request, response) => {
  let todo = new Todo({
    text: request.body.text
  });
  todo.save().then((doc) => {
    response.send(doc);
  }, (error) => {
    response.status(400).send(error);
  })
})

app.get('/todos', (request, response) => {
  Todo.find().then((todos) => {
    response.send({todos});
  }, (error) => {
    response.send(error);
  });
});

app.get('/todos/:id', (request, response) => {
  const id = request.params.id;

  if (!ObjectID.isValid(id)) {
    response.status(404).send();
  }
  Todo.findById(id).then((todo) => {
    if (!todo) {
      response.status(404).send();
    }
    response.send({todo});
  }, (error) => {
      response.status(400).send();
  });
});

app.delete('/todos/:id', (request, response) => {
  const id = request.params.id;

  if (!ObjectID.isValid(id)) {
    response.status(404).send();
  }
  Todo.findByIdAndRemove(id).then((todo) => {
    if (!todo) {
      response.status(404).send();
    }
    response.send({todo});
  }, (error) => {
      response.status(400).send();
  });
});

app.patch('/todos/:id', (request, response) => {
  const id = request.params.id;
  let body = _.pick(request.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) {
    response.status(404).send();
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
    if (!todo) {
      response.status(404).send();
    }
    response.send({todo});
  }, (error) => {
      response.status(400).send();
  });
});

app.post('/users', (request, response) => {
  let {email, password} = _.pick(request.body, ['email', 'password']);
  let user = new User({email, password});

  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    response.header('x-auth', token).send(user);
  }).catch((e) => response.status(400).send(e));
})

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

module.exports = {
  app
};
