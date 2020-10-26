# Spoonfeed
[![License](https://img.shields.io/github/license/borkenware/spoonfeed.svg?style=flat-square)](https://github.com/borkenware/spoonfeed/blob/mistress/LICENSE)

Generate beautiful documentation portals in seconds from easy-to-edit markdown files. Bundle your markdown files
into a Preact app easily distributable on the World Wide Web:tm:

# NOTE
This project is a heavy WIP and is not usable yet.

--------

## Installation
```zsh
# With npm:
npm i @borkenware/spoonfeed

# With yarn:
yarn add @borkenware/spoonfeed

# With pnpm:
pnpm i @borkenware/spoonfeed
```

See USAGE.md for information about how to use this.

## Why?
Writing documentation is already a boring process, and the documentation team may not have time to put into
distributing it in an easy-to-access format.

Spoonfeed takes care of that for you or your team. Focus on writing crystal clear documentation, in an easy-to-edit
format, and let Spoonfeed take care of the rest.

Originally, a few Borkenware projects used their own rice of documentation generator which was a pain since they
all shared slight differences. We decided to unify all of our pieces in a unified tool that not only us can benefit
from.

## Why using Preact?
We love React at Borkenware, but it unfortunately often ends up in rather large bundles, which is not justified here
since we don't use a lot of React features. So we've decided to ship Preact, to have the best of the two worlds.

## Why "Spoonfeed"?
GitHub suggested `fictional-spoon` when creating the repo. No it's not a joke it's actually how it got this name.
