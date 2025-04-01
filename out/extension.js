"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
function extractTestCasesLastInfo(testCasesIdentifiers) {
    console.log("extracting test cases last info");
    return new Promise((resolve, reject) => {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
        const venvPath = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe'); // path to the python executable in the virtual environment venv/Scripts/python.exe
        const scriptPath = path.join(__dirname, '..', 'src', 'extract_test_features.py');
        console.log("📦 Script path:", scriptPath);
        console.log("🐍 Python(venv) path:", venvPath);
        const command = `${venvPath} ${scriptPath}`;
        const process = cp.exec(command, { cwd: workspaceRoot }, (err, stdout, stderr) => {
            if (err || stderr) {
                console.error('❌ Python error:', stderr || err);
                return reject(stderr || err);
            }
            try {
                const result = JSON.parse(stdout.trim());
                console.log('✅ Extracted features:', result);
                resolve(result);
            }
            catch (e) {
                console.error('❌ Failed to parse JSON:', stdout);
                reject(e);
            }
        });
        // Send the testIdentifiers to the Python script via stdin
        process.stdin?.write(JSON.stringify(testCasesIdentifiers));
        process.stdin?.end();
    });
}
function extractXGBPrioritizatedTestCases(testCasesFeaturesArr, parsedTests) {
    return new Promise((resolve, reject) => {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
        const venvPath = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe'); // path to the python executable in the virtual environment venv/Scripts/python.exe
        const scriptPath = path.join(__dirname, '..', 'src', 'extract_XGB_test_cases.py');
        console.log("📦 Script path:", scriptPath);
        console.log("🐍 Python(venv) path:", venvPath);
        const command = `${venvPath} ${scriptPath}`;
        const process = cp.exec(command, { cwd: workspaceRoot }, (err, stdout, stderr) => {
            if (err || stderr) {
                console.error('❌ Python error:', stderr || err);
                return reject(stderr || err);
            }
            try {
                const predictions = JSON.parse(stdout);
                console.log("✅ Model predictions:", predictions);
                resolve(predictions);
            }
            catch (e) {
                console.error("❌ Failed to parse model output:", e);
                reject(e);
            }
        });
        const payload = {
            testCasesFeaturesArr,
            parsedTests
        };
        process.stdin?.write(JSON.stringify(payload));
        process.stdin?.end();
    });
}
function runPrioritizedTests(prioritizedTestCases) {
    return new Promise((resolve, reject) => {
        // const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        // const pythonPath = path.join(workspaceRoot, 'venv', 'Scripts', 'python.exe');
        const scriptPath = path.join(__dirname, '..', 'src', 'run_tests.py');
        // const command = `${pythonPath} ${scriptPath}`;
        const process = cp.exec(`python "${scriptPath}"`, { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath }, (err, stdout, stderr) => {
            if (stderr) {
                //when running the tests the logs are printed in the stderr
                const result = JSON.parse(stdout.trim());
                var failedTestCases = result['failed_test_cases'];
                resolve(failedTestCases);
            }
        });
        process.stdin?.write(JSON.stringify(prioritizedTestCases));
        process.stdin?.end();
    });
}
function activate(context) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('tcp-transboost.testCasePrioritizationTransboost', () => {
        // The code you place here will be executed every time your command is executed
        const scriptPath = path.join(__dirname, '..', 'src', 'discover_tests.py');
        console.log("scriptPath", scriptPath);
        cp.exec(`python "${scriptPath}"`, { cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath }, (err, stdout, stderr) => {
            if (err) {
                console.error('❌ Python error:', stderr);
                return;
            }
            try {
                const parsedTests = JSON.parse(stdout.trim());
                console.log("✅ Found unittests:", parsedTests);
                vscode.window.showInformationMessage(`✅ Found ${parsedTests.length} tests`);
                extractTestCasesLastInfo(parsedTests).then(testCasesFeaturesArr => {
                    extractXGBPrioritizatedTestCases(testCasesFeaturesArr, parsedTests).then(prioritizedTestCases => {
                        //script to run the unittests in that order
                        runPrioritizedTests(prioritizedTestCases).then(failedTestCases => {
                            for (const testCase of failedTestCases) {
                                vscode.window.showInformationMessage('❌ Failed test: ' + testCase);
                            }
                        }).catch(err => {
                            console.log("Unittests logs: ", err);
                        });
                    }).catch(err => {
                        console.error('Failed to extract prioritized XGB test cases:', err);
                    });
                }).catch(err => {
                    console.error('❌ Failed to extract test cases features:', err);
                });
            }
            catch (e) {
                console.error('❌ Failed to parse JSON:', stdout);
            }
        });
    });
    context.subscriptions.push(disposable);
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map