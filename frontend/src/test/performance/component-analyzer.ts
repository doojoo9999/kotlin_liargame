/**
 * Component Performance Analysis Tool
 * Analyzes React components for performance optimization opportunities
 */

import fs from 'fs';
import path from 'path';

interface ComponentAnalysis {
  fileName: string;
  filePath: string;
  size: number;
  complexity: number;
  issues: PerformanceIssue[];
  suggestions: string[];
}

interface PerformanceIssue {
  type: 'missing-memo' | 'missing-callback' | 'inline-object' | 'inline-array' | 'large-component' | 'deep-nesting';
  line: number;
  code: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export class ComponentPerformanceAnalyzer {
  private sourceDir: string;
  private results: ComponentAnalysis[] = [];

  constructor(sourceDir: string = './src') {
    this.sourceDir = sourceDir;
  }

  async analyzeAllComponents(): Promise<ComponentAnalysis[]> {
    const componentFiles = await this.findComponentFiles();
    
    for (const filePath of componentFiles) {
      const analysis = await this.analyzeComponent(filePath);
      if (analysis) {
        this.results.push(analysis);
      }
    }

    return this.results;
  }

  generateReport(): string {
    const sortedResults = this.results.sort((a, b) => {
      const aPriority = a.issues.reduce((sum, issue) =>
        sum + (issue.severity === 'high' ? 3 : issue.severity === 'medium' ? 2 : 1), 0);
      const bPriority = b.issues.reduce((sum, issue) =>
        sum + (issue.severity === 'high' ? 3 : issue.severity === 'medium' ? 2 : 1), 0);
      return bPriority - aPriority;
    });

    let report = '# Component Performance Analysis Report\n\n';

    // Summary
    const totalIssues = this.results.reduce((sum, r) => sum + r.issues.length, 0);
    const highIssues = this.results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'high').length, 0);
    const mediumIssues = this.results.reduce((sum, r) =>
      sum + r.issues.filter(i => i.severity === 'medium').length, 0);

    report += `## Summary\n`;
    report += `- **Total Components Analyzed**: ${this.results.length}\n`;
    report += `- **Total Issues Found**: ${totalIssues}\n`;
    report += `- **High Priority Issues**: ${highIssues}\n`;
    report += `- **Medium Priority Issues**: ${mediumIssues}\n`;
    report += `- **Low Priority Issues**: ${totalIssues - highIssues - mediumIssues}\n\n`;

    // Detailed results
    report += `## Detailed Analysis\n\n`;

    sortedResults.forEach(result => {
      if (result.issues.length === 0) return;

      report += `### ${result.fileName}\n`;
      report += `**File**: \`${result.filePath}\`  \n`;
      report += `**Size**: ${(result.size / 1024).toFixed(2)}KB  \n`;
      report += `**Complexity**: ${result.complexity}  \n\n`;

      if (result.issues.length > 0) {
        report += `#### Issues Found (${result.issues.length})\n\n`;
        result.issues.forEach(issue => {
          const severity = issue.severity.toUpperCase();
          const emoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🔵';

          report += `${emoji} **${severity}** - Line ${issue.line}\n`;
          report += `\`\`\`javascript\n${issue.code}\n\`\`\`\n`;
          report += `${issue.description}\n\n`;
        });
      }

      if (result.suggestions.length > 0) {
        report += `#### Suggestions\n\n`;
        result.suggestions.forEach(suggestion => {
          report += `- ${suggestion}\n`;
        });
        report += '\n';
      }

      report += '---\n\n';
    });

    return report;
  }

  getResults(): ComponentAnalysis[] {
    return this.results;
  }

  private async findComponentFiles(): Promise<string[]> {
    const files: string[] = [];

    const searchDir = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir);

        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
            searchDir(fullPath);
          } else if (stat.isFile() && /\.(tsx|jsx)$/.test(entry)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`Could not read directory ${dir}:`, error);
      }
    };

    searchDir(this.sourceDir);
    return files;
  }

  private async analyzeComponent(filePath: string): Promise<ComponentAnalysis | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const stats = fs.statSync(filePath);

      const analysis: ComponentAnalysis = {
        fileName: path.basename(filePath),
        filePath: filePath,
        size: stats.size,
        complexity: this.calculateComplexity(content),
        issues: [],
        suggestions: []
      };

      // Analyze for performance issues
      this.analyzeForMissingMemo(content, lines, analysis);
      this.analyzeForMissingCallback(content, lines, analysis);
      this.analyzeForInlineObjects(content, lines, analysis);
      this.analyzeForComponentSize(content, analysis);
      this.analyzeForDeepNesting(content, lines, analysis);

      // Generate suggestions
      this.generateSuggestions(analysis);

      return analysis;
    } catch (error) {
      console.warn(`Could not analyze component ${filePath}:`, error);
      return null;
    }
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;

    // Count decision points
    const patterns = [
      /if\s*\(/g,
      /else\s*if\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /\?\s*:/g, // ternary operators
      /&&/g,
      /\|\|/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /catch\s*\(/g
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private analyzeForMissingMemo(content: string, _lines: string[], analysis: ComponentAnalysis): void {
    // Check if component is exported and could benefit from React.memo
    const isComponentFile = /export\s+(?:default\s+)?(?:const|function)\s+\w+/m.test(content);
    const hasMemo = /React\.memo|memo\(/m.test(content);
    const hasProps = /props\s*[:{]/.test(content) || /\(\s*{\s*\w+/.test(content);

    if (isComponentFile && !hasMemo && hasProps && analysis.complexity > 5) {
      analysis.issues.push({
        type: 'missing-memo',
        line: 1,
        code: 'export default Component',
        severity: 'medium',
        description: 'Complex component with props could benefit from React.memo to prevent unnecessary re-renders'
      });
    }
  }

  private analyzeForMissingCallback(_content: string, lines: string[], analysis: ComponentAnalysis): void {
    lines.forEach((line, index) => {
      // Check for inline arrow functions in JSX props
      const inlineFunction = /(\w+)=\{[^}]*=>\s*[^}]*\}/g;
      const matches = line.match(inlineFunction);

      if (matches) {
        matches.forEach(match => {
          analysis.issues.push({
            type: 'missing-callback',
            line: index + 1,
            code: match.trim(),
            severity: 'medium',
            description: 'Inline function creates new reference on every render. Consider useCallback.'
          });
        });
      }

      // Check for missing useCallback on event handlers
      if (line.includes('const ') && line.includes('=') && line.includes('=>')) {
        const isEventHandler = /const\s+\w*(handle|on)\w*\s*=/i.test(line);
        const hasCallback = line.includes('useCallback');

        if (isEventHandler && !hasCallback) {
          analysis.issues.push({
            type: 'missing-callback',
            line: index + 1,
            code: line.trim(),
            severity: 'low',
            description: 'Event handler could be wrapped with useCallback for better performance'
          });
        }
      }
    });
  }

  private analyzeForInlineObjects(_content: string, lines: string[], analysis: ComponentAnalysis): void {
    lines.forEach((line, index) => {
      // Check for inline objects in JSX props
      const inlineObjectPattern = /\w+=\{\{[^}]+\}\}/g;
      const matches = line.match(inlineObjectPattern);

      if (matches) {
        matches.forEach(match => {
          analysis.issues.push({
            type: 'inline-object',
            line: index + 1,
            code: match.trim(),
            severity: 'high',
            description: 'Inline object creates new reference on every render. Move to useMemo or outside component.'
          });
        });
      }

      // Check for inline arrays
      const inlineArrayPattern = /\w+=\{\[[^\]]+\]\}/g;
      const arrayMatches = line.match(inlineArrayPattern);

      if (arrayMatches) {
        arrayMatches.forEach(match => {
          analysis.issues.push({
            type: 'inline-array',
            line: index + 1,
            code: match.trim(),
            severity: 'high',
            description: 'Inline array creates new reference on every render. Move to useMemo or outside component.'
          });
        });
      }
    });
  }

  private analyzeForComponentSize(content: string, analysis: ComponentAnalysis): void {
    const lineCount = content.split('\n').length;
    const componentMatches = content.match(/(?:function|const)\s+\w+[^{]*\{/g);
    const componentCount = componentMatches ? componentMatches.length : 0;

    if (lineCount > 300) {
      analysis.issues.push({
        type: 'large-component',
        line: 1,
        code: `Component has ${lineCount} lines`,
        severity: 'medium',
        description: 'Large component file. Consider breaking into smaller components.'
      });
    }

    if (componentCount > 3) {
      analysis.issues.push({
        type: 'large-component',
        line: 1,
        code: `File contains ${componentCount} components`,
        severity: 'low',
        description: 'Multiple components in one file. Consider separating for better maintainability.'
      });
    }
  }

  private analyzeForDeepNesting(_content: string, lines: string[], analysis: ComponentAnalysis): void {
    lines.forEach((line, index) => {
      const indentLevel = (line.match(/^\s*/)?.[0].length || 0) / 2;

      if (indentLevel > 8 && line.trim().includes('<')) {
        analysis.issues.push({
          type: 'deep-nesting',
          line: index + 1,
          code: line.trim(),
          severity: 'medium',
          description: 'Deep JSX nesting detected. Consider extracting sub-components.'
        });
      }
    });
  }

  private generateSuggestions(analysis: ComponentAnalysis): void {
    const issueTypes = new Set(analysis.issues.map(issue => issue.type));

    if (issueTypes.has('missing-memo')) {
      analysis.suggestions.push('Wrap component with React.memo() to prevent unnecessary re-renders');
    }

    if (issueTypes.has('missing-callback')) {
      analysis.suggestions.push('Use useCallback() for event handlers and functions passed as props');
    }

    if (issueTypes.has('inline-object') || issueTypes.has('inline-array')) {
      analysis.suggestions.push('Move inline objects/arrays to useMemo() or define them outside the component');
    }

    if (issueTypes.has('large-component')) {
      analysis.suggestions.push('Break down large components into smaller, more focused components');
    }

    if (issueTypes.has('deep-nesting')) {
      analysis.suggestions.push('Extract deeply nested JSX into separate components');
    }

    // Size-based suggestions
    if (analysis.size > 10000) { // 10KB
      analysis.suggestions.push('Consider code splitting for this large component');
    }

    // Complexity-based suggestions
    if (analysis.complexity > 20) {
      analysis.suggestions.push('High complexity detected. Consider using custom hooks to extract logic');
    }
  }
}

// CLI usage
export async function runAnalysis(sourceDir: string = './src'): Promise<void> {
  const analyzer = new ComponentPerformanceAnalyzer(sourceDir);
  
  console.log('🔍 Analyzing components for performance issues...');
  await analyzer.analyzeAllComponents();
  
  const report = analyzer.generateReport();
  
  // Write report to file
  fs.writeFileSync('./performance-analysis-report.md', report);
  
  console.log('📊 Analysis complete! Report saved to performance-analysis-report.md');
  console.log('\nSummary:');
  console.log(`- Components analyzed: ${analyzer.getResults().length}`);
  console.log(`- Total issues found: ${analyzer.getResults().reduce((sum: number, r: any) => sum + r.issues.length, 0)}`);
}