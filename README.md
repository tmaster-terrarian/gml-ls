# gml-ls: A GameMaker Language extension for vscode

A simple extension that should support any versions including and above the `2022.0` (LTS) version of GameMaker Studio 2. It aims to support the latest `stable` versions of gamemaker as they come out.
<br>(This extension uses a fair amount of the source code from an old(ish) [extension](https://github.com/gml-support/gml-support) created by LiarOnce under the MIT License)

## Features:

What this extension will do:
- autocompletion, hover, and highlighting of important tokens, such as local variables, macros, built-in functions, etc.
- provide goto definition for most user-created symbols

What this extension will *not* do:
- provide autocompletion/intellisense for instance variables (due to the many nuances with using them)
- know what the context of `self` is at any given moment, especially for global functions (same reason as above)
  <br>*(however, this may be possible in object events, we shall see)*

Capabilities I plan on adding in the future:
- an easier way to add all of the built-in functions and constants
- infer the types of variables to provide info such as hover, completions, etc.
- provide variables that are defined outside of the current working file
- provide the contents of the global struct (to the best of its ability)
- move more of the responsibilities from the client to the language server
