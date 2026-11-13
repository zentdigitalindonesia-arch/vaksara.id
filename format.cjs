const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=__dirname;
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk(path.join(root,'src')).filter(f=>/\.tsx?$/.test(f)&&!f.endsWith('data.ts'));
const options={indentSize:2,tabSize:2,convertTabsToSpaces:true,newLineCharacter:'\n',insertSpaceAfterCommaDelimiter:true,insertSpaceAfterSemicolonInForStatements:true,insertSpaceBeforeAndAfterBinaryOperators:true,insertSpaceAfterKeywordsInControlFlowStatements:true,insertSpaceAfterFunctionKeywordForAnonymousFunctions:true,insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces:true,placeOpenBraceOnNewLineForFunctions:false,placeOpenBraceOnNewLineForControlBlocks:false};
const host={getCompilationSettings:()=>({jsx:ts.JsxEmit.ReactJSX}),getScriptFileNames:()=>files,getScriptVersion:()=> '0',getScriptSnapshot:f=>fs.existsSync(f)?ts.ScriptSnapshot.fromString(fs.readFileSync(f,'utf8')):undefined,getCurrentDirectory:()=>root,getDefaultLibFileName:o=>ts.getDefaultLibFilePath(o),fileExists:ts.sys.fileExists,readFile:ts.sys.readFile};
const service=ts.createLanguageService(host);let changed=0;
for(const file of files){const original=fs.readFileSync(file,'utf8');let text=original;for(const e of service.getFormattingEditsForDocument(file,options).sort((a,b)=>b.span.start-a.span.start))text=text.slice(0,e.span.start)+e.newText+text.slice(e.span.start+e.span.length);if(text!==original){changed++;if(!process.argv.includes('--check'))fs.writeFileSync(file,text);}}
console.log(process.argv.includes('--check')?'Formatting differences:':'Formatted files:',changed);if(process.argv.includes('--check')&&changed)process.exitCode=1;
