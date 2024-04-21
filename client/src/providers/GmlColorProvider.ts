/* eslint-disable */
import * as vscode from "vscode";
import * as gmlGlobals from "./gmlGlobals";
import GmlProvider from "./GmlProvider";

const TagLiteral = (literal: string): vscode.Color =>
{
    let str = literal
    while(str.length < 6)
        str += "0"
    const r = Number("0x" + str[0] + str[1])
    const g = Number("0x" + str[2] + str[3])
    const b = Number("0x" + str[4] + str[5])

    return new vscode.Color(r / 255, g / 255, b / 255, 1);
};

const DollarLiteral = (literal: string): vscode.Color =>
{
    let str = literal
    while(str.length < 6)
        str = "0" + str
    const b = Number("0x" + str[0] + str[1])
    const g = Number("0x" + str[2] + str[3])
    const r = Number("0x" + str[4] + str[5])

    return new vscode.Color(r / 255, g / 255, b / 255, 1);
};

const parseLiteral = (literal: string): vscode.Color =>
{
    switch(literal[0])
    {
        case "$": return DollarLiteral(literal.replace("$", ""));
        case "#": default: return TagLiteral(literal.replace("#", ""));
    }
};

export default class GmlColorProvider implements vscode.DocumentColorProvider, GmlProvider {
    async provideDocumentColors(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.ColorInformation[]>
    {
        if(vscode.workspace.getConfiguration('gml-ls').get('simpleMode', false)) return
        if(!vscode.workspace.getConfiguration('gml-ls').get('enableColors', true)) return

        const includeWorkspaceColors = vscode.workspace.getConfiguration('gml-ls').get('workspaceColors', true)

        const returns: vscode.ColorInformation[] = [];
        const text = document.getText();

        const colorMatcher = /(#|\$)([a-f0-9]+)/gi;
        let colorMatch: RegExpExecArray = null;
        let tokens = 0; const maxTokens = 2;
        while(colorMatch = colorMatcher.exec(text))
        {
            const position = document.positionAt(colorMatch.index);
            const wordRange = new vscode.Range(position, document.positionAt(colorMatch.index + colorMatch[0].length));
            const word = colorMatch[0];

            const prefix = document.getText(new vscode.Range(document.positionAt(0), wordRange.start));

            if(/#macro\s\w+\s$/.test(prefix) && includeWorkspaceColors) continue

            tokens++;

            // if(tokens == maxTokens)
            // {
            //     let userInput = await warnAboutTooDamnManyTokens()
            //     if(!userInput || userInput.title == "Abort")
            //         return returns;
            // }

            returns.push(new vscode.ColorInformation(wordRange, parseLiteral(word)));
        }

        const makeRGBMatcher = /\bmake_colou?r_rgb\s*\(((\s*[0-9]+\s*,)+\s*[0-9]+)\s*\)/g;
        let makeRGBMatch: RegExpExecArray = null
        while(makeRGBMatch = makeRGBMatcher.exec(text))
        {
            const position = document.positionAt(makeRGBMatch.index);
            const wordRange = new vscode.Range(position, document.positionAt(makeRGBMatch.index + makeRGBMatch[0].length));

            const prefix = document.getText(new vscode.Range(document.positionAt(0), wordRange.start));

            if(/#macro\s\w+\s$/.test(prefix) && includeWorkspaceColors) continue

            const col = makeRGBMatch[1].replaceAll(/\s+/g, "").split(",")
            returns.push(new vscode.ColorInformation(
                wordRange,
                new vscode.Color(Number(col[0]) / 255, Number(col[1]) / 255, Number(col[2]) / 255, 1)
            ));
            tokens++;

            // if(tokens == maxTokens)
            // {
            //     let userInput = await warnAboutTooDamnManyTokens()
            //     if(!userInput || userInput.title == "Abort")
            //         return returns;
            // }
        }

        const makeHSVMatcher = /\bmake_colou?r_hsv\s*\(((\s*[0-9]+\s*,)+\s*[0-9]+)\s*\)/g;
        let makeHSVMatch: RegExpExecArray = null
        while(makeHSVMatch = makeHSVMatcher.exec(text))
        {
            const position = document.positionAt(makeHSVMatch.index);
            const wordRange = new vscode.Range(position, document.positionAt(makeHSVMatch.index + makeHSVMatch[0].length));

            const prefix = document.getText(new vscode.Range(document.positionAt(0), wordRange.start));

            if(/#macro\s\w+\s$/.test(prefix) && includeWorkspaceColors) continue

            const hsv = makeHSVMatch[1].replaceAll(/\s+/g, "").split(",");
            const rgb = hsv2rgb(Number(hsv[0]) * 360/255, Number(hsv[1]), Number(hsv[2]));
            returns.push(new vscode.ColorInformation(
                wordRange,
                new vscode.Color(Number(rgb[0]) / 255, Number(rgb[1]) / 255, Number(rgb[2]) / 255, 1)
            ));
            tokens++;

            // if(tokens == maxTokens)
            // {
            //     let userInput = await warnAboutTooDamnManyTokens()
            //     if(!userInput || userInput.title == "Abort")
            //         return returns;
            // }
        }

        if(!includeWorkspaceColors) return returns

        const wordPattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
        let wordMatch: RegExpExecArray = null;
        while(wordMatch = wordPattern.exec(text))
        {
            const position = document.positionAt(wordMatch.index);
            const wordRange = new vscode.Range(position, document.positionAt(wordMatch.index + wordMatch[0].length));
            const word = wordMatch[0];

            const prefix = document.getText(new vscode.Range(document.positionAt(0), wordRange.start));

            const entry = gmlGlobals.constants.hasOwnProperty(word) ? gmlGlobals.constants[word] : null;
            if(entry !== null && entry.hasOwnProperty("color"))
            {
                returns.push(new vscode.ColorInformation(wordRange, entry.color));
                tokens++;

                // if(tokens == maxTokens)
                // {
                //     let userInput = await warnAboutTooDamnManyTokens()
                //     if(userInput == undefined || userInput.title == "Abort")
                //         return returns;
                // }
            }
            else
            {
                for(const document of vscode.workspace.textDocuments)
                {
                    if(!document.uri.path.endsWith(".gml")) continue

                    const text = document.getText();

                    const macrodef = new RegExp("#macro (" + word + ") ((?:[^\\n](\\\\(\\n|\\r\\n))?)+(?=\\n|$))").exec(text);
                    if(macrodef)
                    {
                        const match = /(#|\$)([a-f0-9]+)/i.exec(macrodef[2]);
                        if(match)
                        {
                            returns.push(new vscode.ColorInformation(wordRange, parseLiteral(match[0])));
                            tokens++;
                            break;
                        }
                        const match2 = /\bmake_colou?r_rgb\s*\(\s*((\s*[0-9]+\s*,)+(\s*[0-9]+))\s*\)/.exec(macrodef[2]);
                        if(match2)
                        {
                            const rgb = match2[1].replaceAll(/\s+/g, "").split(",");
                            returns.push(new vscode.ColorInformation(
                                wordRange,
                                new vscode.Color(Number(rgb[0]) / 255, Number(rgb[1]) / 255, Number(rgb[2]) / 255, 1)
                            ));
                            tokens++;
                            break;
                        }
                        const match3 = /\bmake_colou?r_hsv\s*\(\s*((\s*[0-9]+\s*,)+(\s*[0-9]+))\s*\)/.exec(macrodef[2]);
                        if(match3)
                        {
                            const hsv = match3[1].replaceAll(/\s+/g, "").split(",");
                            const rgb = hsv2rgb(Number(hsv[0]) * 360/255, Number(hsv[1]), Number(hsv[2]));
                            returns.push(new vscode.ColorInformation(
                                wordRange,
                                new vscode.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1)
                            ));
                            tokens++;
                            break;
                        }
                    }
                }
            }

            // if(tokens == maxTokens)
            // {
            //     let userInput = await warnAboutTooDamnManyTokens()
            //     if(userInput == undefined || userInput.title == "Abort")
            //         return returns;
            // }
        }

        return returns;
    }

    provideColorPresentations(color: vscode.Color, context: {
        readonly document: vscode.TextDocument;
        readonly range: vscode.Range;
    }, token: vscode.CancellationToken): vscode.ProviderResult<vscode.ColorPresentation[]>
    {
        const returns = [];

        const text = context.document.getText(context.range)

        let r = Math.round(color.red * 255).toString(16);
        let g = Math.round(color.green * 255).toString(16);
        let b = Math.round(color.blue * 255).toString(16);
        if(r.length < 2) r = "0" + r;
        if(g.length < 2) g = "0" + g;
        if(b.length < 2) b = "0" + b;

        //let ins = text == "#macro" ? "#macro " + context.document.getText(context.document.getWordRangeAtPosition(context.range.end.translate(0, 2))) + " " : ""

        const tag = new vscode.ColorPresentation(`#${r}${g}${b}`);
        const dol = new vscode.ColorPresentation(`$${b}${g}${r}`);

        const rgb = new vscode.ColorPresentation(`make_color_rgb(${color.red * 255}, ${color.green * 255}, ${color.blue * 255})`);

        const _hsv = rgb2hsv(color.red * 255, color.green * 255, color.blue * 255)
        const hsv = new vscode.ColorPresentation(`make_color_hsv(${Math.floor(_hsv[0] * 255/360)}, ${Math.round(_hsv[1] * 255)}, ${Math.round(_hsv[2] * 255)})`);

        // tag.textEdit.newText = ins + tag.label
        // rgb.textEdit.newText = ins + rgb.label

        returns.push(tag);
        returns.push(rgb);
        returns.push(hsv);
        returns.push(dol);

        return returns;
    }
}

function warnAboutTooDamnManyTokens()
{
    return vscode.window.showWarningMessage(
        `The Color Provider detected a very large amount of tokens in the current file`,
        {
            detail: "too many tokens"
        },
        <vscode.MessageItem>{
            title: "Parse Anyway",
        }
    )
}

function hsv2rgb(_h: number, _s: number, _v: number)
{
    let h = ((_h % 360) + 360) % 360 // fix negative values (if any)
    let s = Math.min(Math.max(_s, 0), 255) / 255
    let v = Math.min(Math.max(_v, 0), 255) / 255

    let c = s * v
    let x = c * (1 - Math.abs((h/60) % 2) - 1)
    let m = v - c

    let rr = 0
    let gg = 0
    let bb = 0

    //#region
    if(h < 60)
    {
        rr = c
        gg = x
        bb = 0
    }
    else if(h < 120)
    {
        rr = x
        gg = c
        bb = 0
    }
    else if(h < 180)
    {
        rr = 0
        gg = c
        bb = x
    }
    else if(h < 240)
    {
        rr = 0
        gg = x
        bb = c
    }
    else if(h < 300)
    {
        rr = x
        gg = 0
        bb = c
    }
    else if(h < 360)
    {
        rr = c
        gg = 0
        bb = x
    }
    //#endregion

    return [(rr+m)*255,(gg+m)*255,(bb+m)*255]
}

function rgb2hsv(r: number, g: number, b: number): number[]
{
    let computedH = 0;
    let computedS = 0;
    let computedV = 0;

    //remove spaces from input RGB values, convert to int
    let _r = parseInt( (''+r).replace(/\s/g,''),10 );
    let _g = parseInt( (''+g).replace(/\s/g,''),10 );
    let _b = parseInt( (''+b).replace(/\s/g,''),10 );

    // (added by bscit, replaces the error if values are out of bounds)
    // Clamp values
    _r = Math.min(Math.max(_r, 0), 255)
    _g = Math.min(Math.max(_g, 0), 255)
    _b = Math.min(Math.max(_b, 0), 255)

    _r=_r/255; _g=_g/255; _b=_b/255;
    var minRGB = Math.min(_r,Math.min(_g,_b));
    var maxRGB = Math.max(_r,Math.max(_g,_b));

    // Black-gray-white
    if (minRGB==maxRGB) {
        computedV = minRGB;
        return [0,0,computedV];
    }

    // Colors other than black-gray-white:
    var d = (_r==minRGB) ? _g-_b : ((_b==minRGB) ? _r-_g : _b-_r);
    var h = (_r==minRGB) ? 3 : ((_b==minRGB) ? 1 : 5);
    computedH = 60*(h - d/(maxRGB - minRGB));
    computedS = (maxRGB - minRGB)/maxRGB;
    computedV = maxRGB;
    return [computedH == 360 ? 0 : computedH,computedS,computedV];
}
