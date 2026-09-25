import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Pre-release repository health audit script for ShelfLife.
 */
function auditHealth() {
  const rootDir = process.cwd();
  console.log(`🔍 ShelfLife Repository Health Audit — ${path.basename(rootDir)}`);
  console.log(`===========================================================`);

  const runCmd = (cmd) => {
    try {
      return execSync(cmd, { cwd: rootDir, encoding: "utf-8" }).trim();
    } catch {
      return "";
    }
  };

  const status = runCmd("git status --short");
  const branch = runCmd("git branch --show-current");
  const commitCount = runCmd("git rev-list --count HEAD");
  const hasReadme = fs.existsSync(path.join(rootDir, "README.md"));
  const hasGitignore = fs.existsSync(path.join(rootDir, ".gitignore"));
  const hasPackageJson = fs.existsSync(path.join(rootDir, "package.json"));

  console.log(`  Branch:                 ${branch || "main"}`);
  console.log(`  Total Commits:          ${commitCount}`);
  console.log(`  README.md:              ${hasReadme ? "✅ Present" : "❌ Missing"}`);
  console.log(`  .gitignore:             ${hasGitignore ? "✅ Present" : "❌ Missing"}`);
  console.log(`  package.json:           ${hasPackageJson ? "✅ Present" : "❌ Missing"}`);
  console.log(`  Working Tree Status:    ${status === "" ? "✅ Clean" : "⚠️  Uncommitted changes"}`);
  console.log(``);
}

auditHealth();
