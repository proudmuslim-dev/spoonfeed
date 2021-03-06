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

const cache: Record<string, object> = {}
function r (modules: string | string[], resolve?: Function): object | Promise<object> {
  if (Array.isArray(modules)) {
    Promise.all(
      modules.map(mdl =>
        new Promise(resolve => {
          const script = document.createElement('script')
          script.src = '/dist/' + mdl.slice(2);
          script.onload = () => resolve(cache[mdl])
          document.head.appendChild(script);
        })
      )
    ).then(m => resolve(...m))
    return
  }

  if (!cache[modules]) throw new Error('Module not found')
  return cache[modules]
}

(window as any).d = function d (id: string, deps: string[], mdl: Function) {
  if (!mdl) {
    mdl = deps as unknown as Function
    deps = []
  }

  const e = {}
  const args = []
  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i]
    if (dep === 'require') args.push(r)
    else if (dep === 'exports') args.push(e)
    else args.push(r(dep))
  }

  mdl.apply(null, args)
  cache[id] = e
}
