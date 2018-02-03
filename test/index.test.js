import test from 'ava';
import del from 'del';
import assert from 'yeoman-assert';
import webpack from 'webpack';
import options from './helpers/webpack.config.js';

test.before.cb(t => {
  webpack(options, (err, stats) => {
    // Fail test if there are errors
    if (err || stats.hasErrors()) {
      t.end(err || stats.hasErrors());
    }
    t.end();
  });
});

test.after.always(() => {
  del(['test/output/**', 'test/fixtures/*.vue']);
});

test.cb('Basic creation', t => {
  const basic = 'test/fixtures/basic.vue';

  assert.file(basic);
  assert.fileContent(basic, /^<style.*basic.css"><\/style>$/m);
  assert.fileContent(basic, /^<template.*basic.html"><\/template>$/m);
  assert.fileContent(basic, /^<script.*basic.js"><\/script>$/m);

  t.end();
});

test.cb('Attributes', t => {
  const scoped = 'test/fixtures/scoped.vue';
  const functional = 'test/fixtures/functional.vue';
  const scopedFunctional = 'test/fixtures/scoped-functional.vue';

  assert.file([scoped, functional, scopedFunctional]);
  assert.fileContent(scoped, /^<style scoped.*scoped.css"><\/style>$/m);
  assert.fileContent(functional, /^<template functional.*functional.html"><\/template>$/m);
  assert.fileContent(scopedFunctional, /^<style scoped.*scoped-functional.css"><\/style>$/m);
  assert.fileContent(scopedFunctional, /^<template functional.*scoped-functional.html"><\/template>$/m);

  t.end();
});

test.cb('Languages', t => {
  const withLang = [
    'test/fixtures/script-coffee.vue',
    'test/fixtures/template-jade.vue',
    'test/fixtures/template-pug.vue',
    'test/fixtures/style-sass.vue',
    'test/fixtures/style-scss.vue',
    'test/fixtures/style-stylus.vue',
  ];
  const withoutLang = [
    'test/fixtures/template-html.vue',
    'test/fixtures/style-css.vue',
    'test/fixtures/script-js.vue',
  ];

  assert.file(withLang.concat(withoutLang));
  withLang.forEach(file => {
    const lang = file.replace(/^(.+)-(.+)\.(.+)$/, '$2');

    assert.fileContent(file, `lang="${lang}"`);
  });

  withoutLang.forEach(file => {
    assert.noFileContent(file, /lang/);
  });

  t.end();
});
