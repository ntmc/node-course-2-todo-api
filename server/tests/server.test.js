const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, users, populateTodos, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    let text = 'Test todo text';

    request(app)
      .post('/todos')
      .send({text})
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((response) => {
        expect(response.body.text).toBe(text);
      })
      .end((error, result) => {
        if (error) {
          return done(error);
        }

        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return error and not create todo', (done) => {
    request(app)
      .post('/todos')
      .send({})
      .set('x-auth', users[0].tokens[0].token)
      .expect(400)
      .end((error, result) => {
        if (error) {
          return done(error);
        }

        Todo.find().then((todos) => {
          expect(todos.length).toBe(2);
          done();
        }).catch((error) => done(error));
      });
  });
});

describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((response) => {
        expect(response.body.todos.length).toBe(1);
      })
      .end(done)
  });
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((response) => {
        expect(response.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('should not return todo doc created by aother user', (done) => {
    request(app)
      .get(`/todos/${todos[1]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if todo not found', (done) => {
    const hexId = new ObjectID().toHexString();

    request(app)
      .get(`/todos/${hexId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    request(app)
      .get('/todos/123abc')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should remove a todo', (done) => {
    const hexId = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect((response) => {
        expect(response.body.todo._id).toBe(hexId);
      })
      .end((error, response) => {
        if (error) {
          return done(error);
        }

        Todo.findById(hexId).then((todo) => {
          expect(todo).toNotExist();
          done();
        }).catch((e) => done(e));
      });
  });

  it('should not remove a todo of another user', (done) => {
    const hexId = todos[0]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end((error, response) => {
        if (error) {
          return done(error);
        }

        Todo.findById(hexId).then((todo) => {
          expect(todo).toExist();
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return 404 if todo not found', (done) => {
    request(app)
      .delete(`/todos/${new ObjectID().toHexString()}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    request(app)
      .delete('/todos/123')
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    const hexId = todos[0]._id.toHexString();
    const text = 'Something new';

    request(app)
      .patch(`/todos/${hexId}`)
      .send({text, completed: true})
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((response) => {
        expect(response.body.todo.text).toBe(text);
        expect(response.body.todo.completed).toBe(true);
        expect(response.body.todo.completedAt).toBeA('number');
      })
      .end(done);
  });

  it('should not update todo of another user', (done) => {
    const hexId = todos[0]._id.toHexString();
    const text = 'Something new';

    request(app)
      .patch(`/todos/${hexId}`)
      .send({text, completed: true})
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should clear completedAt when todo is not completed', (done) => {
    const hexId = todos[1]._id.toHexString();
    const text = 'Something new';

    request(app)
      .patch(`/todos/${hexId}`)
      .send({text, completed: false})
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect((response) => {
        expect(response.body.todo.text).toBe(text);
        expect(response.body.todo.completed).toBe(false);
        expect(response.body.todo.completedAt).toNotExist();
      })
      .end(done);
  });

  it('should return 404 if todo not found', (done) => {
    request(app)
      .patch(`/todos/${new ObjectID().toHexString()}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    request(app)
      .patch('/todos/123')
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((response) => {
        expect(response.body._id).toBe(users[0]._id.toHexString());
        expect(response.body.email).toBe(users[0].email);
      })
      .end(done);
  });

  it('should return 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((response) => {
        expect(response.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should create a user', (done) => {
    const email = 'test@example.com';
    const password = '987654321';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((response) => {
        expect(response.headers['x-auth']).toExist();
        expect(response.body._id).toExist();
        expect(response.body.email).toBe(email);
      })
      .end((error) => {
        if (error) {
          return done(error);
        }

        User.findOne({email}).then((user) => {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return validation errors if request invalid', (done) => {
    const invalidEmail = 'test';
    const invalidPassword = '1';

    request(app)
      .post('/users')
      .send({invalidEmail, invalidPassword})
      .expect(400)
      .end(done);
  });

  it('should not create user if email in use', (done) => {
    const takenEmail = users[0].email;
    const password = '987654321';

    request(app)
      .post('/users')
      .send({takenEmail, password})
      .expect(400)
      .end(done);
  });
});

describe('POST /users/login', () => {
  it('should login user and return auth token', (done) => {
    request(app)
      .post('/users/login')
      .send({email: users[1].email, password: users[1].password})
      .expect(200)
      .expect((response) => {
        expect(response.headers['x-auth']).toExist();
        expect(response.body._id).toBe(users[1]._id.toHexString());
        expect(response.body.email).toBe(users[1].email);
      })
      .end((error, response) => {
        if (error) {
          return done(error);
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens[1]).toInclude({
            access: 'auth',
            token: response.headers['x-auth']
          });
          done();
        }).catch((e) => done(e));
      });
  });

  it('should reject invalid login', (done) => {
    request(app)
      .post('/users/login')
      .send({email: users[1].email, password: users[1].email + '1'})
      .expect(400)
      .expect((response) => {
        expect(response.headers['x-auth']).toNotExist();
      })
      .end((error, response) => {
        if (error) {
          return done(error);
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens.length).toBe(1);
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((error, response) => {
        if (error) {
          return done(error);
        }

        User.findById(users[0]._id).then((user) => {
          expect(user.tokens.length).toBe(0);
          done();
        }).catch((e) => done(e));
      });
  });
});
