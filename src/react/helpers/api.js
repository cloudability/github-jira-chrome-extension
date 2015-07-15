var request = require('superagent');

module.exports = {
  get: function(url, cb) {
    return request
      .get(url)
      .end(cb); // err, res
  },
  post: function(url, data, cb) {
    return request
      .post(url)
      .send(data)
      .end(cb);
  }
};
