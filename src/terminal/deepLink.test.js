import { describe, expect, test } from 'vitest'
import { planDeepLink } from './deepLink'

describe('planDeepLink', () => {
    test('file in a directory changes into it and cats the file', () => {
        expect(planDeepLink('posts/post-1.md')).toEqual(['cd ~/posts', 'cat post-1.md'])
    })

    test('directory changes into it and lists it', () => {
        expect(planDeepLink('posts')).toEqual(['cd ~/posts', 'ls'])
    })

    test('file at home cats it', () => {
        expect(planDeepLink('bio.md')).toEqual(['cat bio.md'])
    })

    test('nested paths and stray slashes', () => {
        expect(planDeepLink('/posts//2026/x.md/')).toEqual(['cd ~/posts/2026', 'cat x.md'])
    })

    test('percent-encoded segments are decoded', () => {
        expect(planDeepLink('posts/hello%20world.md')).toEqual(['cd ~/posts', `cat 'hello world.md'`])
    })

    test('empty, undefined and traversal-only paths plan nothing', () => {
        expect(planDeepLink(undefined)).toEqual([])
        expect(planDeepLink('')).toEqual([])
        expect(planDeepLink('../..')).toEqual([])
    })

    test('dot segments are dropped', () => {
        expect(planDeepLink('../posts/./x.md')).toEqual(['cd ~/posts', 'cat x.md'])
    })

    test('names with spaces or quotes are quoted for the shell', () => {
        expect(planDeepLink('my posts/it is.md')).toEqual([`cd ~/'my posts'`, `cat 'it is.md'`])
        expect(planDeepLink(`don't.md`)).toEqual([`cat 'don'\\''t.md'`])
    })
})
