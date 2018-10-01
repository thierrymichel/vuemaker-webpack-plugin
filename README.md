# vuemaker-webpack-plugin

![stability-wip](https://img.shields.io/badge/stability-work_in_progress-lightgrey.svg?style=flat-square)
[![Npm Version](https://img.shields.io/npm/v/vuemaker-webpack-plugin.svg?style=flat-square)](https://www.npmjs.com/package/vuemaker-webpack-plugin)
[![Coverage Status](https://img.shields.io/coveralls/thierrymichel/vuemaker-webpack-plugin/master.svg?style=flat-square)](https://coveralls.io/github/thierrymichel/vuemaker-webpack-plugin?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/thierrymichel/vuemaker-webpack-plugin.svg)](https://greenkeeper.io/)

> Webpack plugin to build vue files from html/script/style files.<br>
> Inspired by [vue-builder-webpack-plugin](https://github.com/pksunkara/vue-builder-webpack-plugin) and [gulp-vuemaker](https://github.com/thierrymichel/gulp-vuemaker)

## Description

This plugin takes your `*.js|coffee|css|scss|sass|less|styl|html|pug|jade` files and makes one `*.vue` file for webpack and vue-loader.

## Usage

In your `webpack.config.js`:

```js
const VuemakerWebpackPlugin = require('vuemaker-webpack-plugin');

module.exports = {
  // …
  plugins: [
    new VuemakerWebpackPlugin({
      root: 'src/path/to/components',
    }),
  ],
};
```

### "scoped" support

Add a one line multiline comment on the top (first line) of your style file with `vue` and `scoped` mentioned.

```css
/* vue:scoped */
Your styles here…
```

### "functional" support

Add a one line multiline comment on the top (first line) of your style file with `vue` and `functional` mentioned.

```html
<!-- vue:functional -->
Your template here…
```
