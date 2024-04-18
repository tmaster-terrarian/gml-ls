/* eslint-disable */
import * as path from 'path';
import * as vscode from 'vscode';
import { workspace } from 'vscode';

import * as gmlGlobals from "./gmlGlobals"

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

export function activate(context: vscode.ExtensionContext)
{
	// context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'semanticLanguage' }, new DocumentSemanticTokensProvider(), legend));

	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);

	gmlGlobals.compileFunctions()

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
		documentSelector: [{ scheme: 'file', language: 'gml' }],
		synchronize: {
			// Notify the server about file changes to '.gml files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.gml')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'gmlLanguageServer',
		'gml Language Server',
		serverOptions,
		clientOptions
	);

	const workspaceData = {
		getURIs: () => workspace.findFiles('**/*.gml', '**/datafiles/**'), // find all gml files that aren't in the included files directory
	}

	const tokenTypes = ['class', 'type', 'enum', 'function', 'variable', 'number', 'string'];
	const tokenModifiers = ['declaration', 'readonly', 'local', 'global', 'static', 'definition', 'deprecated', 'defaultLibrary', 'constructor'];
	const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

	context.subscriptions.push(vscode.languages.registerHoverProvider({ language: "gml" }, new GmlHoverProvider()));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ language: "gml" }, new GmlCompletionProvider(), "."));
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: "gml" }, new GmlDocumentSemanticTokensProvider(legend), legend));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider({ language: "gml" }, {
		provideDefinition(document, position, token) {
			const word = document.getText(document.getWordRangeAtPosition(position))

			for(const doc of workspace.textDocuments)
			{
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

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
