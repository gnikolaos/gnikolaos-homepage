import { describe, expect, test } from 'vitest'
import { formatCandidateName } from './formatCandidateName'

describe('formatCandidateName', () => {
    test('keeps the last path segment', () => {
        expect(formatCandidateName('posts/post-1.md')).toBe('post-1.md')
        expect(formatCandidateName('ls')).toBe('ls')
    })

    test('keeps the trailing slash of directories', () => {
        expect(formatCandidateName('~/posts/')).toBe('posts/')
        expect(formatCandidateName('../about-me/')).toBe('about-me/')
        expect(formatCandidateName('/')).toBe('/')
    })
})
