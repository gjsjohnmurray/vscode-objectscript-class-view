import * as vscode from 'vscode';
import * as Cache from 'vscode-cache';
import { AllMembersImplementationProvider } from './allMembersImplementationProvider';

/**
 * Cache for cookies from REST requests to InterSystems servers.
 */
export let cookiesCache: Cache;

export let objectScriptApi: any;

export async function activate(context: vscode.ExtensionContext) {

	// Get the main extension exported API
	const objectScriptExt = vscode.extensions.getExtension("intersystems-community.vscode-objectscript");
	objectScriptApi = objectScriptExt?.isActive ? objectScriptExt.exports : objectScriptExt ? await objectScriptExt.activate() : undefined;

	cookiesCache = new Cache(context, "cookies");

	context.subscriptions.push(
		vscode.languages.registerImplementationProvider(
			{ language: 'objectscript-class' },
			new AllMembersImplementationProvider()
		),
	);
}

export function deactivate() {}
