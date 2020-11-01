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

import { Module } from 'module'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'

import { Config } from './types'
import validate from './validator'

export function findConfig (dir: string | null = null): string | null {
  if (!dir) dir = process.cwd()

  if (existsSync(join(dir, 'spoonfeed.config.js'))) {
    return join(dir, 'spoonfeed.config.js')
  }

  if (existsSync(join(dir, 'package.json'))) {
    return null
  }

  const next = dirname(dir)
  if (next === dir) {
    // We reached system root
    return null
  }

  return findConfig(next)
}

export default function readConfig (): Config {
  const path = findConfig()
  if (!path) return {}

  let cfg;
  try {
    const blob = readFileSync(path, 'utf8')
    const m: any = new Module('cfg')
    m._compile(`module.exports = null; ${blob}`, path)
    cfg = m.exports
  } catch (e) {
    throw new SyntaxError(e)
  }

  if (!cfg) throw new Error('No config was exported')
  validate(cfg)
  return cfg
}
