/* eslint-disable */
import * as vscode from "vscode";
import * as gmlGlobals from "../gmlGlobals";

const literalToColor = (literal: string): vscode.Color =>
{
    const r = Number(literal.substring(0, 3))
    const g = Number(literal.substring(3, 5))
    const b = Number(literal.substring(5, 7))

    return new vscode.Color(r / 255, g / 255, b / 255, 1);
};

const colors: Record<string, vscode.Color> = {
    c_aqua:     new vscode.Color(0, 1, 1, 1),
	c_black:    new vscode.Color(0, 0, 0, 1),
	c_blue:     new vscode.Color(0, 0, 1, 1),
	c_dkgray:   new vscode.Color(0.25, 0.25, 0.25, 1),
	c_fuchsia:  new vscode.Color(1, 0, 1, 1),
	c_gray:     new vscode.Color(0.5, 0.5, 0.5, 1),
	c_green:    new vscode.Color(0, 0.5, 0, 1),
	c_lime:     new vscode.Color(0, 1, 0, 1),
	c_ltgray:   new vscode.Color(0.75, 0.75, 0.75, 1),
	c_maroon:   new vscode.Color(0.5, 0, 0, 1),
	c_navy:     new vscode.Color(0, 0, 0.5, 1),
	c_olive:    new vscode.Color(0.5, 0.5, 0, 1),
	c_orange:   new vscode.Color(1, 0.63, 0.25, 1),
	c_purple:   new vscode.Color(0.5, 0, 0.5, 1),
	c_red:      new vscode.Color(1, 0, 0, 1),
	c_silver:   new vscode.Color(0.75, 0.75, 0.75, 1),
	c_teal:     new vscode.Color(0, 0.75, 0.75, 1),
	c_white:    new vscode.Color(1, 1, 1, 1),
	c_yellow:   new vscode.Color(1, 1, 0, 1),
};

export default class GmlColorProvider implements vscode.DocumentColorProvider {
    provideDocumentColors(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.ColorInformation[]>
    {
        const returns = [];
        const text = document.getText();

        const colorMatcher = /(?<=#)[a-f0-9]+\b/gi;
        let colorMatch: RegExpExecArray = null;
        let tokens = 0; const maxTokens = 10000;
        while((colorMatch = colorMatcher.exec(text)) && tokens < maxTokens)
        {
            const position = document.positionAt(colorMatch.index);
            const wordRange = new vscode.Range(position, document.positionAt(colorMatch.index + colorMatch[0].length));
            const word = colorMatch[0];

            tokens++;

            returns.push(new vscode.ColorInformation(wordRange, literalToColor(word)));
        }

        const wordPattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
        let wordMatch: RegExpExecArray = null;
        while((wordMatch = wordPattern.exec(text)) && tokens < maxTokens)
        {
            const position = document.positionAt(wordMatch.index);
            const wordRange = new vscode.Range(position, document.positionAt(wordMatch.index + wordMatch[0].length));
            const word = wordMatch[0];

            tokens++;

            const entry = gmlGlobals.constants[word] ? gmlGlobals.constants[word] : null;
            if(entry && word.startsWith("c_"))
            {
                returns.push(new vscode.ColorInformation(wordRange, colors[word]));
            }
            else
            {
                for(const document of vscode.workspace.textDocuments)
                {
                    const text = document.getText();

                    const macrodef = new RegExp("#macro\\s(" + word + ")\\s((?:[^\\n](\\\\(\\n|\\r\\n))?)+(?=\\n|$))").exec(text);
                    if(macrodef)
                    {
                        const match = /(?<=#)[a-f0-9]+\b/i.exec(macrodef[2]);
                        if(match)
                        {
                            returns.push(new vscode.ColorInformation(wordRange, literalToColor(match[0])));
                            break;
                        }
                    }
                }
            }
        }

        return returns;
    }

    provideColorPresentations(color: vscode.Color, context: {
        readonly document: vscode.TextDocument;
        readonly range: vscode.Range;
    }, token: vscode.CancellationToken): vscode.ProviderResult<vscode.ColorPresentation[]>
    {
        const returns = [];

        let r = Math.round(color.red * 255).toString(16);
        let g = Math.round(color.green * 255).toString(16);
        let b = Math.round(color.blue * 255).toString(16);
        if(r.length < 2) r = "0" + r;
        if(g.length < 2) g = "0" + g;
        if(b.length < 2) b = "0" + b;

        const tag = new vscode.ColorPresentation("#" + r + g + b);

        const word = context.document.getText(context.range);

        if(word == "make_color_rgb" || word == "make_colour_rgb")
            returns.push(`make_color_rgb(${color.red * 255}, ${color.green * 255}, ${color.blue * 255})`);
        else
            returns.push(tag);

        return returns;
    }
}
