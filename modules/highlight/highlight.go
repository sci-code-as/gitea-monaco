// Copyright 2015 The Gogs Authors. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

package highlight

import (
	"path"
	"strings"

	"code.gitea.io/gitea/modules/setting"
)

var (
	// File name should ignore highlight.
	ignoreFileNames = map[string]bool{
		"license": true,
		"copying": true,
	}

	// File names that are representing highlight classes.
	highlightFileNames = map[string]string{
		"dockerfile":     "dockerfile",
		"makefile":       "makefile",
		"gnumakefile":    "makefile",
		"cmakelists.txt": "cmake",
	}

	// Extensions that are same as highlight classes.
	highlightExts = map[string]struct{}{
		".c":          {},
		".cpp":        {},
		".css":        {},
		".dart":       {},
		".diff":       {},
		".elixir":     {},
		".erlang":     {},
		".go":         {},
		".html":       {},
		".yaml":       {},
		".ini":        {},
		".j":          {},
		".java":       {},
		".js":         {},
		".json":       {},
		".jsx":        {},
		".less":       {},
		".lua":        {},
		".php":        {},
		".properties": {},
		".scala":      {},
		".scss":       {},
		".sql":        {},
		".swift":      {},
		".ts":         {},
		".tsx":        {},
		".xml":        {},
	}

	// Extensions that are not same as highlight classes.
	highlightMapping = map[string]string{
		".as":    "actionscript",
		".aspx":  "aspnet",
		".bat":   "batch",
		".cmd":   "batch",
		".cs":    "csharp",
		".fnc":   "plsql",
		".hs":    "haskell",
		".yml":   "yaml",
		".ino":   "arduino",
		".kt":    "kotlin",
		".ktm":   "kotlin",
		".kts":   "kotlin",
		".m":     "matlab",
		".mlx":   "matlab",
		".pas":   "pascal",
		".patch": "diff",
		".py":    "python",
		".pkb":   "plsql",
		".pkg":   "plsql",
		".pks":   "plsql",
		".ps1":   "powershell",
		".rb":    "ruby",
		".s":     "nasm",
		".sh":    "bash",
		".tex":   "latex",
		".vb":    "vbnet",
	}
)

// NewContext loads highlight map
func NewContext() {
	keys := setting.Cfg.Section("highlight.mapping").Keys()
	for i := range keys {
		highlightMapping[keys[i].Name()] = keys[i].Value()
	}
}

// FileNameToHighlightClass returns the best match for highlight class name
// based on the rule of highlight.js.
func FileNameToHighlightClass(fname string) string {
	fname = strings.ToLower(fname)
	if ignoreFileNames[fname] {
		return "nohighlight"
	}

	if name, ok := highlightFileNames[fname]; ok {
		return "language-" + name
	}

	ext := path.Ext(fname)
	if _, ok := highlightExts[ext]; ok {
		return "language-" + ext[1:]
	}

	name, ok := highlightMapping[ext]
	if ok {
		return "language-" + name
	}

	return "nohighlight"
}
