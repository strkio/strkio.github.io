module.exports = function (value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
};
