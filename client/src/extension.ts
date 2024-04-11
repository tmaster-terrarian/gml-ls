/* eslint-disable */
import * as path from 'path';
import * as vscode from 'vscode';
import { workspace, ExtensionContext, HoverProvider, ProviderResult, Hover } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

const legend = (function() {
	const tokenTypesLegend = [
		'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
		'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
		'method', 'decorator', 'macro', 'variable', 'parameter', 'property', 'label'
	];
	tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

	const tokenModifiersLegend = [
		'declaration', 'documentation', 'var', 'macro', 'static', 'deprecated'
	];
	tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));

	return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();

export function activate(context: ExtensionContext)
{
	// context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'semanticLanguage' }, new DocumentSemanticTokensProvider(), legend));

	context.subscriptions.push(vscode.languages.registerDefinitionProvider({ language: "gml" }, {
		provideDefinition(document, position, token) {
			return null;
		},
	}))

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

	context.subscriptions.push(vscode.languages.registerHoverProvider({ language: "gml" }, new GoHoverProvider()));

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

import gmlGlobals from "./gmlGlobals"

class GoHoverProvider implements HoverProvider {
    public provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
        let enable = vscode.workspace.getConfiguration('gml-gms2').get('suggest.basic', true);
        if (!enable) {
            return undefined;
        }
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }
        const name = document.getText(wordRange);
        let backchar = '';
        if (wordRange.start.character > 0) {
            let backidx = wordRange.start.translate({ characterDelta: -1 });
            backchar = backidx.character < 0 ? '' : document.getText(new vscode.Range(backidx, wordRange.start));
        }
        const availability = "GM Language Availability: ";
        let entry = gmlGlobals.globalfunctions[name];
        if (entry && entry.description && entry.available) {
            const signature = entry.signature;
            const contents = [];
            contents.push(new vscode.MarkdownString(signature));
            contents.push(new vscode.MarkdownString(availability + entry.available + "\n\n[Function]" + entry.description));
            return new vscode.Hover(contents, wordRange);
        }
        entry = gmlGlobals.constants[name];
        if (entry && entry.description && entry.available) {
            const signature = entry.signature;
            const contents = [];
            contents.push(new vscode.MarkdownString(signature));
            contents.push(new vscode.MarkdownString(availability + entry.available + "\n\n[Constant]" + entry.description));
            return new vscode.Hover(contents, wordRange);
        }
        entry = gmlGlobals.globalvariables[name];
        if (entry && entry.description && entry.available) {
            const signature = entry.signature;
            const contents = [];
            contents.push(new vscode.MarkdownString(signature));
            contents.push(new vscode.MarkdownString(availability + entry.available + "\n\n[Variable]" + entry.description));
            return new vscode.Hover(contents, wordRange);
        }
        entry = gmlGlobals.keywords[name];
        if (entry && entry.description && entry.available) {
            const signature = entry.signature;
            const contents = [];
            contents.push(new vscode.MarkdownString(signature));
            contents.push(new vscode.MarkdownString(availability + entry.available + "\n\n[Keyword]" + entry.description));
            return new vscode.Hover(contents, wordRange);
        }
        return undefined;
    }
}

interface IParsedToken {
	line: number;
	startCharacter: number;
	length: number;
	tokenType: string;
	tokenModifiers: string[];
}

class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		const allTokens = this._parseText(document.getText());
		const builder = new vscode.SemanticTokensBuilder();
		allTokens.forEach((token) => {
			builder.push(token.line, token.startCharacter, token.length, this._encodeTokenType(token.tokenType), this._encodeTokenModifiers(token.tokenModifiers));
		});
		return builder.build();
	}

	private _encodeTokenType(tokenType: string): number {
		if (tokenTypes.has(tokenType)) {
			return tokenTypes.get(tokenType)!;
		} else if (tokenType === 'notInLegend') {
			return tokenTypes.size + 2;
		}
		return 0;
	}

	private _encodeTokenModifiers(strTokenModifiers: string[]): number {
		let result = 0;
		for (let i = 0; i < strTokenModifiers.length; i++) {
			const tokenModifier = strTokenModifiers[i];
			if (tokenModifiers.has(tokenModifier)) {
				result = result | (1 << tokenModifiers.get(tokenModifier)!);
			} else if (tokenModifier === 'notInLegend') {
				result = result | (1 << tokenModifiers.size + 2);
			}
		}
		return result;
	}

	private _parseText(text: string): IParsedToken[] {
		const r: IParsedToken[] = [];
		const lines = text.split(/\r\n|\r|\n/);
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			let currentOffset = 0;
			while(currentOffset < line.length)
			{
				let type: string = "";

				const openOffset = line.indexOf('[', currentOffset);
				if (openOffset === -1) {
					break;
				}
				const closeOffset = line.indexOf(']', openOffset);
				if (closeOffset === -1) {
					break;
				}
				const tokenData = this._parseTextToken(line.substring(openOffset + 1, closeOffset));
				r.push({
					line: i,
					startCharacter: openOffset + 1,
					length: closeOffset - openOffset - 1,
					tokenType: tokenData.tokenType,
					tokenModifiers: tokenData.tokenModifiers
				});
				currentOffset = closeOffset;
			}
		}
		return r;
	}

	private _parseTextToken(text: string): { tokenType: string; tokenModifiers: string[]; } {
		const parts = text.split('.');
		return {
			tokenType: parts[0],
			tokenModifiers: parts.slice(1)
		};
	}
}
