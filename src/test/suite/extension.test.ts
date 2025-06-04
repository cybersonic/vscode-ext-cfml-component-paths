import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('isTextEligibleForCodeCompletion', () => {
		assert.strictEqual(myExtension.isTextEligibleForCodeCompletion("new "), true);
		assert.strictEqual(myExtension.isTextEligibleForCodeCompletion("required "), true);
		assert.strictEqual(myExtension.isTextEligibleForCodeCompletion("public "), true);
		assert.strictEqual(myExtension.isTextEligibleForCodeCompletion("private "), true);
		assert.strictEqual(myExtension.isTextEligibleForCodeCompletion("package "), true);
		assert.strictEqual(myExtension.isTextEligibleForCodeCompletion("public string function init("), true);
		assert.strictEqual(myExtension.isTextEligibleForCodeCompletion("public string function init( "), false);
		assert.strictEqual(myExtension.isTextEligibleForCodeCompletion("public string function init(required string p1, "), true);
		assert.strictEqual(myExtension.isTextEligibleForCodeCompletion("public string function init(required string p1,"), false);
		assert.strictEqual(myExtension.isTextEligibleForCodeCompletion("	, "), true);
		assert.strictEqual(myExtension.isTextEligibleForCodeCompletion("	,"), false);
	});

	test('componentPathToNativeReference', () => {
		assert.strictEqual(myExtension.componentPathToNativeReference("/c/path/to/project", "/c/path/to/project/MyComponent.cfc"), "MyComponent");
		assert.strictEqual(myExtension.componentPathToNativeReference("/c/path/to/project", "/c/path/to/project/another/MyComponent.cfc"), "another.MyComponent");
	});
	
	test('componentPathToNativeReference with mappings path', async () => {
		// Mapping from nomap -> mapped
		// Mock vscode.workspace.getConfiguration
		const mockUpdate = sinon.stub();
		const mockGetConfiguration = sinon.stub(vscode.workspace, 'getConfiguration').returns({
			update: mockUpdate,
			get: sinon.stub().returns([
				{
					source: "/nomap",
					target: "/mapped"
				}
			])
		} as any);

		assert.strictEqual(myExtension.componentPathToNativeReference("/c/path/to/project", "/c/path/to/project/nomap/MyComponent.cfc"), "mapped.MyComponent");
		assert.strictEqual(myExtension.componentPathToNativeReference("/c/path/to/project", "/c/path/to/project/nomap/another/MyComponent.cfc"), "mapped.another.MyComponent");
	});
});
