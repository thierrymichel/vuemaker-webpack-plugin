const each = require('async/each');
const fs = require('fs');
const junk = require('junk');
const path = require('path');
const readDir = require('recursive-readdir');
const replaceExt = require('replace-ext');
const {
  sortBy,
  indexOf,
} = require('lodash');

/**
 * VuemakerPlugin
 *
 * @param {object} options options
 * @returns {undefined}
 */
function VuemakerPlugin (options = {}) {
  if (options.root) {
    if (path.isAbsolute(options.root)) {
      this.root = options.root;
    } else {
      this.root = path.resolve(path.join(process.cwd(), options.root));
    }
  } else {
    this.root = process.cwd();
  }
}

/**
 * Get infos from extension.
 *
 * @param {string} ext file extension
 * @returns {object|null} tag + lang attribute
 */
VuemakerPlugin.getFromExt = function getFromExt(ext) {
  // Set element + optional attribute
  switch (ext) {
    case '.css':
      return {
        tag: 'style',
        lang: null,
      };
    case '.sass':
      return {
        tag: 'style',
        lang: 'sass',
      };
    case '.scss':
      return {
        tag: 'style',
        lang: 'scss',
      };
    case '.styl':
      return {
        tag: 'style',
        lang: 'stylus',
      };
    case '.html':
      return {
        tag: 'template',
        lang: null,
      };
    case '.jade':
      return {
        tag: 'template',
        lang: 'jade',
      };
    case '.pug':
      return {
        tag: 'template',
        lang: 'pug',
      };
    case '.js':
      return {
        tag: 'script',
        lang: null,
      };
    case '.coffee':
      return {
        tag: 'script',
        lang: 'coffee',
      };
    default:
      /* istanbul ignore next */
      return null;
  }
};

/**
 * Check if scoped (\/* vue:scoped *\/).
 *
 * @param {string} content file content
 * @returns {boolean} scoped or not
 */
VuemakerPlugin.isScoped = function isScoped(content) {
  const endLine = content.indexOf('\n');
  const re = /^\/\*.*vue.*scoped.*\*\/$/;
  const str = content.slice(0, endLine);

  return str.match(re) !== null;
};

/**
 * Check if functional (\/* vue:functional *\/).
 *
 * @param {string} content file content
 * @returns {boolean} functional or not
 */
VuemakerPlugin.isFunctional = function isFunctional(content) {
  const endLine = content.indexOf('\n');
  const re = /^<!--.*vue.*functional.*-->$/;
  const str = content.slice(0, endLine);

  return str.match(re) !== null;
};

/**
 * Build .vue files.
 *
 * @param {string} root root folder for files
 * @param {function} cb callback
 * @returns {undefined}
 */
VuemakerPlugin.build = function build(root, cb) {
  console.info('Building .vue files');
  const components = new Map();

  readDir(root).then(
    files => {
      files
        .filter(file => junk.not(path.basename(file)))
        .forEach(file => {
          if (path.extname(file) !== '.vue') {
            const component = VuemakerPlugin.getFromExt(path.extname(file));
            const componentName = replaceExt(file, '.vue');

            component.content = fs.readFileSync(file, 'utf-8');
            component.source = file;

            if (components.has(componentName)) {
              components.get(componentName).push(component);
            } else {
              components.set(componentName, [
                component,
              ]);
            }
          }
        });
      VuemakerPlugin.write(components, cb);
    },
    err => {
      /* istanbul ignore next */
      cb(err);
    }
  );
};

/**
 * Write .vue files.
 *
 * @param {Map} components components with partials
 * @param {function} cb callback
 * @returns {undefined}
 */
VuemakerPlugin.write = function write(components, cb) {
  each(
    components,
    (component, callback) => {
      const [filename] = component;
      let tags = component[1].map(partial => {
        const tag = {};
        const attribute = partial.lang ? ` lang="${partial.lang}"` : '';
        const scoped = VuemakerPlugin.isScoped(partial.content) ? ' scoped' : '';
        const functional = VuemakerPlugin.isFunctional(partial.content) ? ' functional' : '';

        tag.name = partial.tag;
        tag.content = `<${partial.tag}${attribute}${scoped}${functional} src="${partial.source}"></${partial.tag}>\n`;

        return tag;
      });

      // Sort tags by type property.
      const order = ['style', 'template', 'script'];

      tags = sortBy(tags, tag => indexOf(order, tag.name));

      // Write .vue file.
      fs.writeFile(
        filename,
        tags.map(tag => tag.content).join(''),
        () => {
          callback();
        }
      );
    },
    err => {
      if (err) {
        /* istanbul ignore next */
        cb(err);
      } else {
        cb();
      }
    }
  );
};

VuemakerPlugin.prototype.apply = function apply(compiler) {
  const { root } = this;

  compiler.hooks.run.tapAsync('vuemaker-webpack-plugin', (compiler, cb) => {
    VuemakerPlugin.build(root, cb);
  });
  compiler.hooks.watchRun.tapAsync('vuemaker-webpack-plugin', (compiler, cb) => {
    /* istanbul ignore next */
    VuemakerPlugin.build(root, cb);
  });
  compiler.hooks.afterCompile.tapAsync('vuemaker-webpack-plugin', (compilation, cb) => {
    for (const file of compilation.fileDependencies) {
      if (path.extname(file) === '.vue') {
        compilation.fileDependencies.delete(file);
      }
    }
    cb();
  });
};

module.exports = VuemakerPlugin;
