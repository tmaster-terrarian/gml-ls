/* eslint-disable */
import * as path from 'path';
import * as vscode from 'vscode';
import { workspace } from 'vscode';

import * as gmlGlobals from "./providers/gmlGlobals"

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

import GmlHoverProvider from "./providers/GmlHoverProvider";
import GmlCompletionProvider from "./providers/GmlCompletionProvider";
import GmlDocumentSemanticTokensProvider from "./providers/GmlDocumentSemanticTokensProvider";
import GmlColorProvider from "./providers/GmlColorProvider";
import {GmlReferenceProvider} from './providers/GmlReferenceProvider';
import {GmlRenameProvider} from './providers/GmlReferenceProvider';

export let State: vscode.Memento = null

export function activate(context: vscode.ExtensionContext)
{
	State = context.workspaceState

	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ language: 'gml' }],
		synchronize: {
			// Notify the server about file changes to '.gml files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.gml')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'gml-ls',
		'gml Language Server',
		serverOptions,
		clientOptions
	);

	gmlGlobals.recompile()

	const workspaceData = {
		getURIs: () => workspace.findFiles('**/*.gml', '**/datafiles/**'), // find all gml files that aren't in the included files directory
	}

	const tokenTypes = ['class', 'type', 'enum', 'function', 'variable', 'number', 'string'];
	const tokenModifiers = ['declaration', 'readonly', 'local', 'global', 'static', 'definition', 'deprecated', 'defaultLibrary', 'constructor', 'builtinLocal'];
	const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

	context.subscriptions.push(vscode.languages.registerHoverProvider({ language: "gml" }, new GmlHoverProvider()));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ language: "gml" }, new GmlCompletionProvider(), "."));
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: "gml" }, new GmlDocumentSemanticTokensProvider(legend), legend));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider({ language: "gml" }, {
		provideDefinition(document, position, token)
		{
			if(vscode.workspace.getConfiguration('gml-ls').get('simpleMode', false)) return
			if(!vscode.workspace.getConfiguration('gml-ls').get('workspaceDefinitions', true)) return

			const word = document.getText(document.getWordRangeAtPosition(position))

			for(const doc of workspace.textDocuments)
			{
				if(document.uri.path.endsWith(".git")) continue
				if(!document.uri.path.endsWith(".gml")) continue

				const text = doc.getText()

				let macrodef = new RegExp("(?<=#macro\\s)" + word + "\\b").exec(text)
				if(macrodef)
				{
					let idx = macrodef.index;

					return new vscode.Location(doc.uri, doc.getWordRangeAtPosition(doc.positionAt(idx)));
				}

				let functiondef = new RegExp("((?<=\\bfunction\\s)\\s*" + word + "\\b|\\b" + word + "(?=\\s*=\\s*function\\s*\\())").exec(text)
				if(functiondef)
				{
					let idx = functiondef.index;
					for(var i = 0; i < 1000; i++)
						if(text[idx] !== word[0])
							idx++;
						else break;

					return new vscode.Location(doc.uri, doc.getWordRangeAtPosition(doc.positionAt(idx)));
				}

				let gobal = new RegExp("(?<=\\bglobal)\\s*\\.\\s*(" + word + ")\\s*=").exec(text)
				if(gobal)
				{
					let idx = gobal.index;
					for(var i = 0; i < 1000; i++)
						if(text[idx] !== word[0])
							idx++;
						else break;

					return new vscode.Location(doc.uri, doc.getWordRangeAtPosition(doc.positionAt(idx)));
				}
			}

			const text = document.getText()

			let vardef = new RegExp("(?<=\\bvar\\s)\\s*(" + word + ")\\b").exec(text)
			if(vardef)
			{
				let idx = vardef.index;
				for(var i = 0; i < 1000; i++)
					if(text[idx] !== word[0])
						idx++;
					else break;

				return new vscode.Location(document.uri, document.getWordRangeAtPosition(document.positionAt(idx)));
			}

			return null;
		},
	}));
	context.subscriptions.push(vscode.languages.registerColorProvider({ language: "gml" }, new GmlColorProvider()));
	context.subscriptions.push(vscode.languages.registerReferenceProvider({ language: "gml" }, new GmlReferenceProvider()));
	context.subscriptions.push(vscode.languages.registerRenameProvider({ language: "gml" }, new GmlRenameProvider()));

	// load gamemaker project file
	// this will allow an easy way to know what assets exist in the workspace
	workspace.findFiles("**/*.yyp").then(uris => {
		workspace.fs.readFile(uris[0]).then(arr => {
			State.update("yyp", JSON.parse(new TextDecoder().decode(arr).replaceAll(/,(?=\s*(\}|\]))/g, "")))
		})
	})

	//	FINISH: add a way to universally get workspace symbols from a cache that gets updated dynamically
	//	
	//	const files: GmlFile[]
	//	
	//	class GmlFile: {
	//		symbols: Symbol[],
	//		uri: Uri
	//	}
	//	
	//	class Symbol: {
	//		range: Range,
	//		identifier: string,
	//		type: SymbolType,
	//		scopeRange?: Range
	//	}
	//	
	//	enum SymbolType: {
	//		LocalVariable = 0,
	//		ScriptFunction = 1,
	//		Macro = 2,
	//		Parameter = 3
	//	}

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
		gmlGlobals.recompile()
	}))

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
