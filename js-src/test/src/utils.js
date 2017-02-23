Promise.prototype.always = function(onResolveOrReject) {
  return this.then(onResolveOrReject,
    function(reason) {
      return Promise.resolve(onResolveOrReject(reason))
      .then(() => {
        throw reason;
      })
      .catch((err) => {
        throw err;
      })
      
    });
};