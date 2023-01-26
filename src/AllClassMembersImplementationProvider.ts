import * as vscode from "vscode";
import { objectScriptApi } from "./extension";
import { quoteUDLIdentifier, serverForUri } from "./functions";
import { makeRESTRequest } from "./makeRESTRequest";
import { QueryData } from "./types";

export class AllClassMembersImplementationProvider implements vscode.ImplementationProvider {

  public provideImplementation(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Thenable<vscode.LocationLink[]> {
    return new Promise(async (resolve, reject) => {

      const members: vscode.LocationLink[] = [];
      let originSelectionRange = new vscode.Range(0, 0, 1, 0);
      let className = "";

      let inComment = false;
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);

        // Skip initial comment block(s)
        if (line.text.match(/\/\*/)) {
          inComment = true;
        }
        if (inComment) {
          if (line.text.match(/\*\//)) {
            inComment = false;
          }
          continue;
        }

        // Discover class name
        const classPat = line.text.match(/^(Class) (%?\b\w+\b(?:\.\b\w+\b)+)/i);
        if (classPat) {
          className = classPat[2];
          originSelectionRange = new vscode.Range(i, 0, i, line.text.indexOf(className) + className.length);
          break;
        }
      }

      if (className) {

        // Start with class itself as the first implementation so setting "editor.gotoLocation.multipleImplementations": "gotoAndPeek" works predictably.
        // We intentionally set the selectionRange to include the "Class " prefix on the definition line, so it stands out in the "Find All Implementations" view.
        const item: vscode.LocationLink = {
          originSelectionRange,
          targetRange: originSelectionRange,
          targetSelectionRange: originSelectionRange,
          targetUri: document.uri
        };
        members.push(item);
  

				// Query the server to get the metadata of all appropriate class members
				var data: QueryData = {
					query: "SELECT Name, Description, Origin, FormalSpec, ReturnType AS Type, 'method' AS MemberType, Deprecated " +
          "FROM %Dictionary.CompiledMethod WHERE parent->ID = ? AND Abstract = 0 AND Internal = 0 AND Stub IS NULL AND ((Origin = parent->ID) OR (Origin != parent->ID AND NotInheritable = 0)) UNION ALL %PARALLEL " +
          "SELECT Name, Description, Origin, FormalSpec, Type, 'query' AS MemberType, Deprecated " +
          "FROM %Dictionary.CompiledQuery WHERE parent->ID = ? AND Internal = 0 UNION ALL %PARALLEL " +
          "SELECT Name, Description, Origin, NULL AS FormalSpec, Type, 'projection' AS MemberType, Deprecated " +
          "FROM %Dictionary.CompiledProjection WHERE parent->ID = ? AND Internal = 0 UNION ALL %PARALLEL " +
          "SELECT Name, Description, Origin, NULL AS FormalSpec, NULL AS Type, 'index' AS MemberType, Deprecated " +
          "FROM %Dictionary.CompiledIndex WHERE parent->ID = ? AND Internal = 0 UNION ALL %PARALLEL " +
          "SELECT Name, Description, Origin, NULL AS FormalSpec, NULL AS Type, 'foreignkey' AS MemberType, Deprecated " +
          "FROM %Dictionary.CompiledForeignKey WHERE parent->ID = ? AND Internal = 0 UNION ALL %PARALLEL " +
          "SELECT Name, Description, Origin, NULL AS FormalSpec, NULL AS Type, 'trigger' AS MemberType, Deprecated " +
          "FROM %Dictionary.CompiledTrigger WHERE parent->ID = ? AND Internal = 0 UNION ALL %PARALLEL " +
          "SELECT Name, Description, Origin, NULL AS FormalSpec, NULL AS Type, 'xdata' AS MemberType, Deprecated " +
          "FROM %Dictionary.CompiledXData WHERE parent->ID = ? AND Internal = 0 UNION ALL %PARALLEL " +
          "SELECT Name, Description, Origin, NULL AS FormalSpec, RuntimeType AS Type, 'property' AS MemberType, Deprecated " +
          "FROM %Dictionary.CompiledProperty WHERE parent->ID = ? AND Internal = 0 UNION ALL %PARALLEL " +
          "SELECT Name, Description, Origin, NULL AS FormalSpec, Type, 'parameter' AS MemberType, Deprecated " +
          "FROM %Dictionary.CompiledParameter WHERE parent->ID = ? AND Internal = 0",
					parameters: new Array(9).fill(className)
				};
        const server = await serverForUri(document.uri);
				const respdata = await makeRESTRequest("POST", 1, "/action/query", server, data);
				if (respdata !== undefined && respdata.data.status.errors.length === 0 && respdata.data.result.content.length > 0) {
					// We got data back

          // For each class that is an origin of a member, get its uri and symbols
          const originsMap = new Map<string, { uri: vscode.Uri, symbols: vscode.DocumentSymbol[] }>();
          for (let memobj of respdata.data.result.content) {
            if (!originsMap.has(memobj.Origin)) {
              const uri = objectScriptApi.getUriForDocument(`${memobj.Origin}.cls`);
              const symbols: vscode.DocumentSymbol[] =  await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri);
              originsMap.set(memobj.Origin, { uri, symbols: symbols[0].children });
            }
          }

          // Fallback ranges in case we don't find a symbol
					const range = new vscode.Range(0, 0, 1, 0);
					const selectionRange = new vscode.Range(0, 0, 1, 0);

          // Create an entry for each member
					for (let memobj of respdata.data.result.content) {
            const originData = originsMap.get(memobj.Origin);
            if (originData) {
              const symbolInfo = originData.symbols.find((symbol) => symbol.name === quoteUDLIdentifier(memobj.Name, 1));
              
              // Ignore the IDKEY index if it doesn't appear in the symbols
              if (!symbolInfo && memobj.Name === 'IDKEY' && memobj.MemberType === 'index') {
                continue;
              }

              const targetSelectionRange = symbolInfo?.selectionRange ?? selectionRange;
              const targetRange = symbolInfo?.range ?? range;
              const item: vscode.LocationLink = {
                originSelectionRange,
                targetRange: targetSelectionRange, //targetRange.with(targetSelectionRange.start), // Don't include comment block above member definition line
                targetSelectionRange,
                targetUri: originData.uri
              };
              members.push(item);
            }
					}
				}

        resolve(members);
      }
    });
  }
}
