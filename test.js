'use strict';

/* eslint-env mocha */

/*
 * Dependencies.
 */

var slug = require('./');
var mdast = require('mdast');
var assert = require('assert');

/*
 * Methods.
 */

var equal = assert.strictEqual;
var deepEqual = assert.deepEqual;
var throws = assert.throws;

/**
 * Parse `doc` with mdast, and apply `slug` to
 * the resulting `ast` with `options`.
 *
 * @param {string} doc - Document.
 * @param {Object?} options - Slug options.
 * @return {Node} - Parsed and transformed `doc`.
 */
function process(doc, options) {
    var processor = mdast().use(slug, options);

    return processor.run(processor.parse(doc, {
        'position': false
    }));
}

/*
 * Testes.
 */

describe('mdast-slug', function () {
    it('should accept `library` as a function', function () {
        deepEqual(process('# I ♥ unicode', {
            'library': require('to-slug-case')
        }), {
            'type': 'root',
            'children': [
                {
                    'type': 'heading',
                    'depth': 1,
                    'children': [
                        {
                            'type': 'text',
                            'value': 'I ♥ unicode'
                        }
                    ],
                    'attributes': {
                        'id': 'i-unicode'
                    }
                }
            ]
        });
    });

    it('should accept `library` as a package name', function () {
        deepEqual(process('# I ♥ unicode', {
            'library': 'to-slug-case'
        }), {
            'type': 'root',
            'children': [
                {
                    'type': 'heading',
                    'depth': 1,
                    'children': [
                        {
                            'type': 'text',
                            'value': 'I ♥ unicode'
                        }
                    ],
                    'attributes': {
                        'id': 'i-unicode'
                    }
                }
            ]
        });
    });

    it('should accept `library` as a file', function () {
        deepEqual(process('# I ♥ unicode', {
            'library': 'node_modules/to-slug-case/index'
        }), {
            'type': 'root',
            'children': [
                {
                    'type': 'heading',
                    'depth': 1,
                    'children': [
                        {
                            'type': 'text',
                            'value': 'I ♥ unicode'
                        }
                    ],
                    'attributes': {
                        'id': 'i-unicode'
                    }
                }
            ]
        });
    });

    it('should add `attributes.id` to headings', function () {
        var ast = process([
            '# Normal',
            '',
            '## Table of Contents',
            '',
            '# Baz',
            ''
        ].join('\n'));

        equal(ast.children[0].attributes.id, 'normal');
        equal(ast.children[1].attributes.id, 'table-of-contents');
        equal(ast.children[2].attributes.id, 'baz');
    });

    it('should not overwrite `attributes` on headings', function () {
        var processor = mdast().use(slug);
        var ast = processor.parse('# Normal', {
            'position': false
        });

        ast.children[0].attributes = {
            'class': 'bar'
        };

        processor.run(ast);

        equal(ast.children[0].attributes.class, 'bar');
    });

    it('should throw when a plugin cannot be found', function () {
        throws(function () {
            process('', {
                'library': 'foo'
            });
        }, /Cannot find module 'foo'/);
    });

    describe('github', function () {
        it('should work', function () {
            deepEqual(process([
                '# I ♥ unicode',
                '',
                '# Foo-bar',
                '',
                '# ',
                '',
                '😄-😄',
                '==='
            ].join('\n')), {
                'type': 'root',
                'children': [
                    {
                        'type': 'heading',
                        'depth': 1,
                        'children': [
                            {
                                'type': 'text',
                                'value': 'I ♥ unicode'
                            }
                        ],
                        'attributes': {
                            'id': 'i--unicode'
                        }
                    },
                    {
                        'type': 'heading',
                        'depth': 1,
                        'children': [
                            {
                                'type': 'text',
                                'value': 'Foo-bar'
                            }
                        ],
                        'attributes': {
                            'id': 'foo-bar'
                        }
                    },
                    {
                        'type': 'heading',
                        'depth': 1,
                        'children': [],
                        'attributes': {
                            'id': ''
                        }
                    },
                    {
                        'type': 'heading',
                        'depth': 1,
                        'children': [
                            {
                                'type': 'text',
                                'value': '😄-😄'
                            }
                        ],
                        'attributes': {
                            'id': ''
                        }
                    }
                ]
            });
        });
    });

    describe('npm', function () {
        it('should work', function () {
            deepEqual(process([
                '# I ♥ unicode',
                '',
                '# Foo-bar',
                '',
                '# ',
                '',
                '😄-😄',
                '==='
            ].join('\n'), {
                'library': 'npm'
            }), {
                'type': 'root',
                'children': [
                    {
                        'type': 'heading',
                        'depth': 1,
                        'children': [
                            {
                                'type': 'text',
                                'value': 'I ♥ unicode'
                            }
                        ],
                        'attributes': {
                            'id': 'i-unicode'
                        }
                    },
                    {
                        'type': 'heading',
                        'depth': 1,
                        'children': [
                            {
                                'type': 'text',
                                'value': 'Foo-bar'
                            }
                        ],
                        'attributes': {
                            'id': 'foo-bar'
                        }
                    },
                    {
                        'type': 'heading',
                        'depth': 1,
                        'children': [],
                        'attributes': {
                            'id': ''
                        }
                    },
                    {
                        'type': 'heading',
                        'depth': 1,
                        'children': [
                            {
                                'type': 'text',
                                'value': '😄-😄'
                            }
                        ],
                        'attributes': {
                            'id': ''
                        }
                    }
                ]
            });
        });
    });
});
