const {ObjectID} = require('mongodb');

const {mongoose} = require('./../server/db/mongoose')
const {User} = require('./../server/models/user');

const id = '58fde8b0647505943a5cf587';

if (!ObjectID.isValid(id)) {
  return console.log('Invalid ID');
}

User.findById(id).then((user) => {
  if (!user) {
    return console.log('ID not found');
  }
  console.log(user);
}).catch((error) => console.log(error));
