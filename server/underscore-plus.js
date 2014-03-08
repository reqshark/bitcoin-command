var _;

_ = require('underscore');

_.mixin({
  toDictionary: function(arr, key) {
    if (!_.isArray(arr)) {
      throw new Error('_.toDictionary takes an Array');
    }
    return _.reduce(arr, function(dict, obj) {
      var k;
      k = typeof key === "function" ? key(obj) : void 0;
      if (!k) {
        if (obj[key] == null) {
          return dict;
        }
        k = obj[key];
      }
      dict[k] = obj;
      return dict;
    }, {});
  }
});

module.exports = _;
