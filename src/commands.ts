"use strict";
import * as vscode from 'vscode';
var path = require('path');
var dateFormat = require('dateformat');

let configPrefix: string = "fileHeaderCommentHelper";

export function insertFileHeaderComment() {
    let _workspace = vscode.workspace;
    let _window = vscode.window;
    let _editor = _window.activeTextEditor;
    let _root = _workspace.rootPath;
    let _filename = _editor.document.fileName;
    console.log(_filename);

    var projConf = _workspace.getConfiguration((configPrefix + ".projectSettings"));
    var langConfs = _workspace.getConfiguration((configPrefix + ".languageConfigs"));

    var values = {
        "projectName": undefined,
        "currentFile": undefined
    };

    if (_editor !== undefined) {
        var languageStr = ("language_" + _editor.document.languageId);

        if (projConf.has("projectName") && projConf.get("projectName") !== null) {
            values.projectName = projConf.get("projectName");
        } else if (_root !== undefined) {
            var folders = _root.split(path.sep)
            values.projectName = folders[folders.length - 1];
        } else {
            vscode.window.showErrorMessage("projectName undefined!");
        }
        if (_root !== undefined) {
            values.currentFile = _editor.document.fileName.replace(_root, "").substr(1);
        } else {
            values.currentFile = _filename;
        }

        if (langConfs.has(languageStr)) {
            var template = (langConfs.get(languageStr + ".template") as Array<string>).join("\n");

            _editor.edit((edit) => {
                edit.insert(new vscode.Position(0, 0), template
                    .replace("$(projectName)", values.projectName)
                    .replace("$(currentFile)", values.currentFile)
                    .replace("$(FileBasename)", path.basename(values.currentFile))
                    .replace("$(date)", (new Date()).toLocaleString())
                    .replace(/\$\(date\:([^\)]+)?\)/i, (match, datefmt) => {
                        try {
                            return dateFormat(new Date(), !datefmt ? "isoDateTime" : datefmt);
                        } catch (err) { }
                    }));
            });

            vscode.commands.executeCommand("workbench.action.files.save");
        } else {
            var openGlobalSettingsItem: vscode.MessageItem = {
                "title": "Open Global Settings"
            };
            var openWorkspaceSettingsItem: vscode.MessageItem = {
                "title": "Open Workspace Settings"
            };

            vscode.window.showErrorMessage(
                ("Unable to locate file-header-comment template for " +
                    _editor.document.languageId + "."),
                openGlobalSettingsItem, openWorkspaceSettingsItem
            ).then((selectedItem: vscode.MessageItem) => {
                if (selectedItem === openGlobalSettingsItem) {
                    vscode.commands.executeCommand(
                        "workbench.action.openGlobalSettings"
                    );
                } else if (selectedItem === openWorkspaceSettingsItem) {
                    vscode.commands.executeCommand(
                        "workbench.action.openWorkspaceSettings"
                    );
                }
            });
        }
    }
}
