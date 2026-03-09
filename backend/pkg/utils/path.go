package utils

import (
	"os"
	"path/filepath"
)

// GetProjectRoot attempts to find the project root directory.
// It searches for "go.mod" starting from the current working directory and moving up.
// This allows running the binary from any subdirectory within the project.
func GetProjectRoot() string {
	if root := os.Getenv("AIWORLD_ROOT"); root != "" {
		return root
	}

	dir, err := os.Getwd()
	if err != nil {
		return "."
	}

	for {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			// Reached root of filesystem, fallback to CWD if go.mod not found
			// This might happen in production if we just copy the binary and assets
			// In that case, we assume CWD is the root
			cwd, _ := os.Getwd()
			return cwd
		}
		dir = parent
	}
}

// GetDataFilePath returns the absolute path to a data file in the project root.
func GetDataFilePath(filename string) string {
	return filepath.Join(GetProjectRoot(), filename)
}

// GetFrontendPath returns the absolute path to the frontend public directory.
func GetFrontendPath() string {
	return filepath.Join(GetProjectRoot(), "frontend/public")
}
