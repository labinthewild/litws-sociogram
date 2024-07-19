var path = require("path");

var config = {
  //mode: 'production',
  mode: 'development',
  entry: path.join(__dirname, "study-manager.js"),
  output: {
    path: path.join(__dirname, "js"),
    filename: "study-bundle.min.js"
  },
  module: {
    rules: [
        {
          test: /.*\.html$/, loader: "handlebars-loader"
        }
    ]
  },
  externals: [
    {
       d3: "d3"
    }
  ],
  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "url": false
    },
  }
};

module.exports = config;
