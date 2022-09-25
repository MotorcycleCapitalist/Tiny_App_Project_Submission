const getUserEmail = (email, database) =>{
    return Object.keys(database).find(key => database[key].email == email);
  }

module.exports = {getUserEmail}