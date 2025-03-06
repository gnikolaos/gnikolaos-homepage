import js from '@eslint/js'
import globals from 'globals'
import solidPlugin from 'eslint-plugin-solid'
import prettier from 'eslint-plugin-prettier/recommended'

export default [
    js.configs.recommended,
    solidPlugin.configs['flat/recommended'],
    prettier,
    {
        files: ['**/*.js', '**/*.jsx'],
        rules: {
            'no-unused-vars': 'error',
            'no-undef': 'error',
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
]
