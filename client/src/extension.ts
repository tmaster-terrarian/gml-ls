/* eslint-disable */
import * as path from 'path';
import * as vscode from 'vscode';
import { workspace } from 'vscode';
import * as lib from '../../lib/out/lib'

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

let wuhoh: vscode.StatusBarItem = null

export function activate(context: vscode.ExtensionContext)
{
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

	gmlGlobals.recompile(true)

	const workspaceData = {
		getURIs: () => workspace.findFiles('**/*.gml', '**/datafiles/**'), // find all gml files that aren't in the included files directory
	}

	const tokenTypes = ['class', 'type', 'enum', 'function', 'variable', 'number', 'string'];
	const tokenModifiers = ['declaration', 'readonly', 'local', 'global', 'static', 'definition', 'deprecated', 'defaultLibrary', 'constructor', 'builtinLocal', 'resource'];
	const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);


	context.subscriptions.push(vscode.languages.registerHoverProvider({ language: "gml" }, new GmlHoverProvider()));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ language: "gml" }, new GmlCompletionProvider(), "."));
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: "gml" }, new GmlDocumentSemanticTokensProvider(legend), legend));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider({ language: "gml" }, {
		async provideDefinition(document, position, token)
		{
			if(vscode.workspace.getConfiguration('gml-ls').get('simpleMode', false)) return
			if(!vscode.workspace.getConfiguration('gml-ls').get('workspaceDefinitions', true)) return

			const word = document.getText(document.getWordRangeAtPosition(position))
			const prefix = document.getText().slice(0, document.offsetAt(document.getWordRangeAtPosition(position).start))

			const documents = await lib.getWorkspaceDocuments(await vscode.workspace.findFiles("**/*.gml", "**/datafiles/**"))

			for(const doc of documents)
			{
				if(document.uri.path.endsWith(".git")) continue
				if(!document.uri.path.endsWith(".gml")) continue

				const text = doc.getText()

				let macrodef = new RegExp("(?<=#macro\\s)" + word + "\\b").exec(text)
				if(macrodef)
				{
					let idx = macrodef.index;

					return new vscode.Location(doc.uri, new vscode.Range(doc.positionAt(idx), doc.positionAt(idx + word.length)));
				}

				let enumdef = new RegExp("(?<=\\benum\\s)\\s*" + word + "\\b").exec(text)
				if(enumdef)
				{
					let idx = enumdef.index;
					for(var i = 0; i < 1000; i++)
						if(text[idx] !== word[0])
							idx++;
						else break;

					return new vscode.Location(doc.uri, new vscode.Range(doc.positionAt(idx), doc.positionAt(idx + word.length)));
				}

				let enummemberSource = new RegExp("(\\w+)\\s*\\.\\s*$").exec(prefix)
				if(enummemberSource)
				{
					let enummemberdef = new RegExp("\\benum\\s+" + enummemberSource[1] + "\\s*\\{(\\n|.)*" + word + "(\\n|.)*?\\}").exec(text)
					if(enummemberdef)
					{
						let idx = enummemberdef.index;

						return new vscode.Location(doc.uri, new vscode.Range(doc.positionAt(idx), doc.positionAt(idx + word.length)));
					}
				}

				let functiondef = new RegExp("((?<=\\bfunction\\s)\\s*" + word + "\\b|\\b" + word + "(?=\\s*=\\s*function\\s*\\())").exec(text)
				if(functiondef)
				{
					let idx = functiondef.index;
					for(var i = 0; i < 1000; i++)
						if(text[idx] !== word[0])
							idx++;
						else break;

					return new vscode.Location(doc.uri, new vscode.Range(doc.positionAt(idx), doc.positionAt(idx + word.length)));
				}

				// let gobal = new RegExp("(?<=\\bglobal)\\s*\\.\\s*(" + word + ")\\s*=").exec(text)
				// if(gobal)
				// {
				// 	let idx = gobal.index;
				// 	for(var i = 0; i < 1000; i++)
				// 		if(text[idx] !== word[0])
				// 			idx++;
				// 		else break;

				// 	return new vscode.Location(doc.uri, new vscode.Range(doc.positionAt(idx), doc.positionAt(idx + word.length)));
				// }
			}

			const text = document.getText()

			// let vardef = new RegExp("(?<=\\bvar\\s)\\s*(" + word + ")\\b").exec(text)
			// if(vardef)
			// {
			// 	let idx = vardef.index;
			// 	for(var i = 0; i < 1000; i++)
			// 		if(text[idx] !== word[0])
			// 			idx++;
			// 		else break;

			// 	return new vscode.Location(document.uri, document.getWordRangeAtPosition(document.positionAt(idx)));
			// }

			return null;
		},
	}));
	context.subscriptions.push(vscode.languages.registerColorProvider({ language: "gml" }, new GmlColorProvider()));
	context.subscriptions.push(vscode.languages.registerReferenceProvider({ language: "gml" }, new GmlReferenceProvider()));
	context.subscriptions.push(vscode.languages.registerRenameProvider({ language: "gml" }, new GmlRenameProvider()));

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(recompile))

	wuhoh = vscode.window.createStatusBarItem("projectStatus", vscode.StatusBarAlignment.Left)
	context.subscriptions.push(wuhoh)

	wuhoh.name = "GameMaker Project Status"
	wuhoh.command = undefined
	wuhoh.text = "$(sync~spin) GameMaker Project"
	wuhoh.tooltip = new vscode.MarkdownString("Importing GameMaker Project...")
	wuhoh.show()

	context.subscriptions.push(vscode.commands.registerCommand("gml-ls.action.reimportProject", () => {
		wuhoh.text = "$(sync~spin) GameMaker Project"
		wuhoh.tooltip = new vscode.MarkdownString("Importing GameMaker Project...")
		wuhoh.show()

		lib.CreateWorkspaceState(context.workspaceState).then(result => {
			afterImport()
		});
	}))

	lib.CreateWorkspaceState(context.workspaceState).then(result => {
		afterImport()

		// Start the client. This will also launch the server
		client.start()
	});
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

function recompile(event: vscode.ConfigurationChangeEvent)
{
	gmlGlobals.recompile(true)
}

export function afterImport()
{
	if(lib.yypLocation !== null)
	{
		wuhoh.command = undefined
		wuhoh.hide()
	}
	else
	{
		wuhoh.text = "$(error) GameMaker Project"
		wuhoh.tooltip = new vscode.MarkdownString("Import failed - yyp file was not found")
		wuhoh.command = "gml-ls.action.reimportProject"
	}
}
