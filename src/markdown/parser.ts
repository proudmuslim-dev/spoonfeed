/*
 * Copyright (c) 2020 Borkenware, All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import {
  BlockType, RawMarkdownNode, MarkdownNode,
  MarkdownCommentNode, MarkdownHeadingNode,
  MarkdownSimpleNode, MarkdownNoteNode, MarkdownAstTree,
  MarkdownListNode, InlineType, MarkdownHttpNode,
  MarkdownHttpItemNode, MarkdownCodeNode, MarkdownTableNode
} from './types'

import { parseBlocks } from './util'
import parseInline from './inline'

function findTables (markdown: string) {
  const matches = markdown.matchAll(/^(?:\|[^|\n]+)+\|\n(?:\|(?::-{2,}:|-{2,}))+\|\n(?:(?:\|[^|\n]+)+\|(?:\n|$))+/img)
  const filtered = []
  for (const match of matches) {
    const pipes = match[0].split('\n').map(l => l.match(/(?<!\\)\|/g)!!.length)
    if (pipes.every(p => pipes[0] === p)) filtered.push(match)
  }
  return filtered
}

const BlockRuleSet = [
  { regexp: /<!--(?:.|\n)*?-->/img, type: BlockType.Comment },
  { regexp: /^#{1,6} [^\n]+/img, type: BlockType.Heading },
  { regexp: /^[^\n]+\n[=-]{2,}/img, type: BlockType.Heading },
  { regexp: /^(?:>(?:info|warn|danger))\n(?:(?<!\\)> [^\n]*(?:\n|$))+/img, type: BlockType.Note },
  { regexp: /^(?:> [^\n]*(?:\n|$))+/img, type: BlockType.Quote },
  { regexp: /^```[^\n]*\n(?:.|\n)+?\n```/img, type: BlockType.Code },
  { regexp: /(?:^ *(?<!\\)(?:[-+*]|\d\.) [^\n]+(?:\n|$))+/img, type: BlockType.List, noTrim: true },
  { regexp: findTables, type: BlockType.Table },
  { regexp: /^(?:%% (?:GET|POST|PUT|PATCH|DELETE|HEAD) [^\n]+$)/img, type: BlockType.Http },
  { regexp: /^(?:\*{3,}|-{3,}|_{3,})$/img, type: BlockType.Ruler },
  { regexp: /^(?:[^\n]+(?:\n|$))+/img, type: BlockType.Paragraph }
]

function parseComment (node: RawMarkdownNode): MarkdownCommentNode {
  const content = node.content as string
  return {
    type: BlockType.Comment,
    content: content.replace(/(<!--|-->)/g, '').split('\n').map(s => s.trim()).join('\n')
  }
}

function parseHeader (node: RawMarkdownNode): MarkdownHeadingNode {
  const content = node.content as string
  if (content.startsWith('#')) {
    const [ h, ...title ] = content.split(' ')
    return {
      type: BlockType.Heading,
      level: h.length,
      content: parseInline(title.join(' '))
    }
  }

  return {
    type: BlockType.Heading,
    level: content.endsWith('=') ? 1 : 2,
    content: parseInline(content.split('\n')[0])
  }
}

function parseParagraph (node: RawMarkdownNode): MarkdownSimpleNode {
  const content = node.content as string
  return {
    type: BlockType.Paragraph,
    content: parseInline(content)
  }
}

function parseNote (node: RawMarkdownNode): MarkdownNoteNode {
  const content = node.content as string
  let [ kind, ...inner ] = content.split('\n')
  return {
    type: BlockType.Note,
    kind: kind.slice(1) as 'info' | 'warn' | 'danger',
    content: parse(inner.map(l => l.slice(2)).join('\n'))
  }
}

function parseQuote (node: RawMarkdownNode): MarkdownSimpleNode {
  const content = node.content as string
  return {
    type: BlockType.Quote,
    content: parse(content.split('\n').map(l => l.slice(2)).join('\n'))
  }
}

function parseList (node: RawMarkdownNode): MarkdownListNode {
  return doParseList(node.content as string)
}

function doParseList (list: string): MarkdownListNode {
  const rawItems = list.split('\n').filter(Boolean)
  const content: (MarkdownListNode | MarkdownSimpleNode)[] = []
  const baseTab = rawItems[0].match(/^ +/)!![0].length
  let accumulating = false
  let buffer: string[] = []

  for (const item of rawItems) {
    const tab = item.match(/^ +/)!![0].length
    if (accumulating && tab === baseTab) {
      content.push(doParseList(buffer.join('\n')))
      accumulating = false
      buffer = []
    } else if (!accumulating && tab > baseTab) {
      accumulating = true
    }

    if (accumulating) buffer.push(item)
    else content.push({ type: BlockType.ListItem, content: parseInline(item.trim().slice(2).trim()) })
  }

  return {
    type: BlockType.List,
    ordered: !!list.match(/^ +\d/),
    content
  }
}

function parseHttp (node: RawMarkdownNode): MarkdownHttpNode {
  const content = node.content as string
  const route: MarkdownHttpItemNode[] = []
  const [ , method, rawPath ] = content.match(/^%% (GET|POST|PUT|PATCH|DELETE|HEAD) ([^\n]+)/)!!
  route.push({ type: InlineType.HttpMethod, content: method })
  for (const match of rawPath.matchAll(/([^{]+)({[^}]+})?/g)) {
    route.push({ type: InlineType.Text, content: match[1] })
    if (match[2]) route.push({ type: InlineType.HttpParam, content: match[2] })
  }

  return {
    type: BlockType.Http,
    content: route
  }
}

function parseCode (node: RawMarkdownNode): MarkdownCodeNode {
  const content = node.content as string
  const [ , lang, code ] = content.match(/^```([^\n]*)\n(.*)\n```$/i)!!
  return {
    type: BlockType.Code,
    language: lang || null,
    content: code
  }
}

function parseTable (node: RawMarkdownNode): MarkdownTableNode {
  const content = node.content as string
  const [ head, align, ...rows ] = content.split('\n').filter(Boolean)
  return {
    type: BlockType.Table,
    centered: align.split('|').slice(1, -1).map(s => s.includes(':')),
    thead: head.split('|').slice(1, -1).map(s => parseInline(s.trim())),
    tbody: rows.map(row => row.split('|').slice(1, -1).map(s => parseInline(s.trim())))
  }
}

function formatBlock (node: RawMarkdownNode): MarkdownNode {
  switch (node.type) {
    case BlockType.Comment:
      return parseComment(node)
    case BlockType.Heading:
      return parseHeader(node)
    case BlockType.Paragraph:
      return parseParagraph(node)
    case BlockType.Note:
      return parseNote(node)
    case BlockType.Quote:
      return parseQuote(node)
    case BlockType.List:
      return parseList(node)
    case BlockType.Http:
      return parseHttp(node)
    case BlockType.Code:
      return parseCode(node)
    case BlockType.Table:
      return parseTable(node)
    case BlockType.Ruler:
      return { type: BlockType.Ruler }
    default:
      throw new Error('Illegal node type encountered: ' + node.type)
  }
}

function formatBlocks (blocks: RawMarkdownNode[]): MarkdownNode[] {
  return blocks.map(formatBlock) as MarkdownNode[]
}

export default function parse (markdown: string): MarkdownAstTree {
  return formatBlocks(parseBlocks(BlockRuleSet, markdown))
}
