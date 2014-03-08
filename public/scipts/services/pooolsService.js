/*
    Pools Service
 */
bitcoinApp.factory('pools', function($resource) {
  var resource;
  resource = $resource('/pools/:id', {
    id: '@id'
  }, {
    "delete": {
      method: 'DELETE',
      params: {
        id: '@id'
      }
    }
  });
  return {
    getAll: function() {
      return resource.query();
    },
    get: function(id) {
      return resource.get({
        id: id
      });
    },
    save: function(pool) {
      return pool.$save();
    },
    "delete": function(id) {
      return resource["delete"]({
        id: id
      });
    }
  };
});

