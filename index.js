const del = require('del');
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
      this.directory = options.root;
    } else {
      this.directory = path.resolve(path.join(process.cwd(), options.root));
    }
  } else {
    this.directory = process.cwd();
  }
  this.folder = options.folder || false;
}

/**
 * Get infos from extension.
 *
 * @param {string} ext file extension
 * @returns {object|null} tag + lang attribute
 */
VuemakerPlugin.prototype.getFromExt = function getFromExt(ext) {
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
      return null;
  }
};

/**
 * Check if scoped (\/* vue:scoped *\/).
 *
 * @param {string} content file content
 * @returns {boolean} scoped or not
 */
VuemakerPlugin.prototype.isScoped = function isScoped(content) {
  const endLine = content.indexOf('\n');
  const re = /^\/\*.*vue.*scoped.*\*\/$/;
  const str = content.slice(0, endLine);

  return str.match(re) !== null;
};

/**
 * Build .vue files.
 *
 * @param {Compiler} compiler webpack plugin Compiler
 * @param {function} cb callback
 * @returns {undefined}
 */
VuemakerPlugin.prototype.build = function build(compiler, cb) {
  console.info('Building .vue files');
  const components = new Map();

  readDir(this.directory).then(
    (files) => {
      files
        .filter((file) => junk.not(path.basename(file)))
        .forEach((file) => {
          if (path.extname(file) !== '.vue') {
            const component = this.getFromExt(path.extname(file));
            const componentName = replaceExt(file, '.vue');

            component.content = fs.readFileSync(file, 'utf-8');

            if (components.has(componentName)) {
              components.get(componentName).push(component);
            } else {
              components.set(componentName, [
                component,
              ]);
            }
          }
        });
      this.write(components, cb);
    },
    (err) => {
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
VuemakerPlugin.prototype.write = function write(components, cb) {
  this.files = [];

  each(
    components,
    (component, callback) => {
      const [filename] = component;
      let tags = component[1].map((partial) => {
        const tag = {};
        const attribute = partial.lang ? ` lang="${partial.lang}"` : '';
        const scoped = this.isScoped(partial.content) ? ' scoped' : '';

        tag.name = partial.tag;
        tag.content = `<${partial.tag}${attribute}${scoped}>
  ${partial.content}</${partial.tag}>
  `;

        return tag;
      });

      // Sort tags by type property.
      const order = ['style', 'template', 'script'];

      tags = sortBy(tags, (tag) => indexOf(order, tag.name));

      // Write .vue file.
      fs.writeFile(
        filename,
        tags.map((tag) => tag.content).join(''),
        () => {
          this.files.push(filename);
          callback();
        }
      );
    },
    (err) => {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    }
  );
};

VuemakerPlugin.prototype.clean = function clean() {
  del(this.files).then(() => {
    console.info('Deleted .vue files');
  });
};

VuemakerPlugin.prototype.apply = function apply(compiler) {
  compiler.plugin('run', this.build.bind(this));
  compiler.plugin('watch-run', this.build.bind(this));
  compiler.plugin('done', this.clean.bind(this));
};

module.exports = VuemakerPlugin;
