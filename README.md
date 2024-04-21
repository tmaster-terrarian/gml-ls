# gml-ls: A GameMaker Language extension for vscode

[Open on Github](https://github.com/tmaster-terrarian/gml-ls)

note: if you want to use an extension that is quite a bit more complete, you should check out [Stitch](https://github.com/bscotch/stitch) by bscotch.

A simple extension that should support any versions including and above the `2022.0` (LTS) version of GameMaker Studio 2. It aims to support the latest `stable` versions of gamemaker as they come out.
<br>(This extension uses a fair amount of the source code from an old(ish) [extension](https://github.com/gml-support/gml-support) created by LiarOnce under the MIT License)

## Features:

What this extension will do:
- autocompletion, hover, and highlighting of important tokens, such as local variables, macros, built-in functions, etc.
- provide goto definition references for constants (namely script functions and macros)
- provide colors for color literals, `color_make_*` functions, and macros
- allow maximum customizability
  - you are able to toggle nearly every feature of the extension via user/workspace settings

What this extension will *not* do:
- provide autocompletion/intellisense for the contents of the global struct
- provide autocompletion/intellisense for instance variables (due to the many nuances with using them)
- know what the context of `self` is at any given moment, especially for in global functions
  <br>*(however, this may be possible in object events, we shall see)*

Capabilities I plan on adding in the future:
- an easier way to implement all of the built-in functions and constants
- infer the types of variables to provide info in things like hover, completions, etc.
- move more of the responsibilities from the client to the language server
