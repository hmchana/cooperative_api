//@    Logs request to console
const logger = (req, res, next) => {
  req.hello = 'Hello World';
  console.log('Middleware run');
  next();
};

module.exports = logger;
