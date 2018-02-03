const VuemakerWebpackPlugin = require('../../index');

module.exports = {
  entry: './test/helpers/entry',
  output: {
    path: `${__dirname}/../output`,
    filename: 'bundle.js',
  },
  plugins: [
    new VuemakerWebpackPlugin({
      root: 'test/fixtures',
    }),
  ],
};
