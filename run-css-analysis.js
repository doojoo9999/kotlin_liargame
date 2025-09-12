const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runCSSAnalysis() {
    console.log('🚀 Starting Comprehensive CSS Analysis...');
    
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });

    const page = await browser.newPage();
    
    // Set up console monitoring
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        });
    });

    try {
        console.log('📡 Connecting to http://localhost:5175/...');
        await page.goto('http://localhost:5175/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        console.log('⏱️  Waiting for React components to load...');
        await page.waitForTimeout(5000);

        // First take a screenshot
        console.log('📸 Taking initial screenshot...');
        await page.screenshot({ 
            path: 'css-analysis-before.png',
            fullPage: true 
        });

        console.log('🔍 Analyzing CSS issues...');
        
        const analysis = await page.evaluate(() => {
            const results = {
                whiteBorderElements: [],
                cssLoadStatus: {},
                tailwindStatus: { loaded: false, classes: [] },
                componentStyles: [],
                globalStyles: {},
                possibleIssues: []
            };

            // Check for white borders comprehensively
            const allElements = document.querySelectorAll('*');
            let whiteBorderCount = 0;
            
            allElements.forEach((el, index) => {
                const computed = getComputedStyle(el);
                
                // Check all border properties
                const borderTop = computed.borderTopColor;
                const borderRight = computed.borderRightColor;
                const borderBottom = computed.borderBottomColor;
                const borderLeft = computed.borderLeftColor;
                const borderColor = computed.borderColor;
                
                const hasWhiteBorder = [borderTop, borderRight, borderBottom, borderLeft, borderColor].some(color => 
                    color.includes('255, 255, 255') || 
                    color === 'white' || 
                    color === 'rgb(255, 255, 255)' ||
                    color === '#ffffff' ||
                    color === '#fff'
                );
                
                if (hasWhiteBorder && el.offsetWidth > 0 && el.offsetHeight > 0) {
                    whiteBorderCount++;
                    
                    if (whiteBorderCount <= 15) { // Capture detailed info for first 15
                        results.whiteBorderElements.push({
                            index: index,
                            tag: el.tagName.toLowerCase(),
                            id: el.id || '',
                            className: el.className || '',
                            borderTop: computed.borderTop,
                            borderRight: computed.borderRight,
                            borderBottom: computed.borderBottom,
                            borderLeft: computed.borderLeft,
                            borderColor: computed.borderColor,
                            position: {
                                x: el.offsetLeft,
                                y: el.offsetTop,
                                width: el.offsetWidth,
                                height: el.offsetHeight
                            },
                            parent: el.parentElement ? {
                                tag: el.parentElement.tagName.toLowerCase(),
                                className: el.parentElement.className
                            } : null,
                            innerHTML: el.innerHTML.substring(0, 100) // First 100 chars
                        });
                    }
                }
            });
            
            results.totalWhiteBorders = whiteBorderCount;

            // Check Tailwind CSS loading
            let tailwindClasses = [];
            const stylesheets = Array.from(document.styleSheets);
            
            stylesheets.forEach(sheet => {
                try {
                    const rules = sheet.cssRules || sheet.rules;
                    if (rules) {
                        Array.from(rules).forEach(rule => {
                            if (rule.selectorText) {
                                // Look for Tailwind classes
                                if (rule.selectorText.includes('.')) {
                                    const classes = rule.selectorText.match(/\.[a-zA-Z0-9_-]+/g);
                                    if (classes) {
                                        tailwindClasses.push(...classes);
                                    }
                                }
                            }
                        });
                    }
                } catch (e) {
                    // Cross-origin or other stylesheet issues
                }
            });
            
            results.tailwindStatus = {
                loaded: tailwindClasses.length > 0,
                classes: tailwindClasses.slice(0, 20), // First 20 classes found
                totalClasses: tailwindClasses.length
            };

            // Check for CSS custom properties
            const rootStyles = getComputedStyle(document.documentElement);
            const cssVars = {};
            
            // Check some key CSS variables
            ['--background', '--foreground', '--border', '--primary', '--card'].forEach(varName => {
                cssVars[varName] = rootStyles.getPropertyValue(varName).trim();
            });
            
            results.globalStyles.cssVariables = cssVars;

            // Check for theme classes
            const htmlElement = document.documentElement;
            results.globalStyles.theme = {
                hasLightClass: htmlElement.classList.contains('light'),
                hasDarkClass: htmlElement.classList.contains('dark'),
                allClasses: Array.from(htmlElement.classList)
            };

            // Look for React component elements
            const reactComponents = document.querySelectorAll('[data-testid], [class*="Component"], [class*="Page"], [class*="Main"], [class*="Light"]');
            reactComponents.forEach((comp, index) => {
                if (index < 10) { // Limit to first 10 components
                    const styles = getComputedStyle(comp);
                    results.componentStyles.push({
                        element: comp.tagName.toLowerCase(),
                        testId: comp.getAttribute('data-testid'),
                        className: comp.className,
                        styles: {
                            display: styles.display,
                            position: styles.position,
                            background: styles.backgroundColor,
                            color: styles.color,
                            border: styles.border,
                            padding: styles.padding,
                            margin: styles.margin
                        }
                    });
                }
            });

            return results;
        });

        // Analyze network requests
        const cssRequests = await page.evaluate(() => {
            return performance.getEntriesByType('resource')
                .filter(entry => 
                    entry.name.includes('.css') || 
                    entry.name.includes('style') ||
                    entry.name.includes('tailwind')
                )
                .map(entry => ({
                    name: entry.name,
                    status: entry.responseStatus || 200,
                    size: entry.transferSize,
                    duration: entry.duration
                }));
        });

        // Generate comprehensive report
        const report = {
            timestamp: new Date().toISOString(),
            url: page.url(),
            title: await page.title(),
            analysis,
            cssRequests,
            consoleErrors: consoleMessages.filter(msg => 
                msg.type === 'error' || 
                (msg.type === 'warning' && msg.text.toLowerCase().includes('css'))
            ),
            recommendations: []
        };

        // Generate recommendations
        if (analysis.totalWhiteBorders > 0) {
            report.recommendations.push({
                priority: 'HIGH',
                issue: `${analysis.totalWhiteBorders} elements with white borders detected`,
                solution: 'Update css-fixes.css to use proper border colors for the theme'
            });
        }

        if (!analysis.tailwindStatus.loaded) {
            report.recommendations.push({
                priority: 'HIGH',
                issue: 'Tailwind CSS not detected',
                solution: 'Check PostCSS configuration and CSS import statements'
            });
        }

        if (!analysis.globalStyles.cssVariables['--background']) {
            report.recommendations.push({
                priority: 'MEDIUM',
                issue: 'CSS custom properties not loading properly',
                solution: 'Check CSS variable definitions in index.css'
            });
        }

        // Save detailed report
        const reportPath = path.join(process.cwd(), 'css-analysis-detailed-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Print analysis results
        console.log('\n' + '='.repeat(50));
        console.log('📊 CSS ANALYSIS RESULTS');
        console.log('='.repeat(50));
        
        console.log(`🌐 URL: ${report.url}`);
        console.log(`📄 Page: ${report.title}`);
        console.log(`🎨 Tailwind Classes: ${analysis.tailwindStatus.totalClasses}`);
        console.log(`🔲 White Borders: ${analysis.totalWhiteBorders}`);
        console.log(`📁 CSS Files: ${cssRequests.length}`);
        console.log(`⚠️  Console Errors: ${report.consoleErrors.length}`);
        console.log(`🧩 React Components: ${analysis.componentStyles.length}`);
        
        if (analysis.whiteBorderElements.length > 0) {
            console.log('\n🔲 WHITE BORDER ELEMENTS:');
            analysis.whiteBorderElements.forEach((elem, i) => {
                console.log(`${i + 1}. ${elem.tag}${elem.id ? '#' + elem.id : ''}${elem.className ? '.' + elem.className.replace(/\s+/g, '.') : ''}`);
                console.log(`   Border: ${elem.borderColor}`);
                console.log(`   Size: ${elem.position.width}×${elem.position.height}`);
                if (elem.parent) {
                    console.log(`   Parent: ${elem.parent.tag}.${elem.parent.className}`);
                }
                console.log('');
            });
        }

        console.log('\n🎯 RECOMMENDATIONS:');
        report.recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. [${rec.priority}] ${rec.issue}`);
            console.log(`   Solution: ${rec.solution}`);
            console.log('');
        });

        console.log(`📄 Full report: ${reportPath}`);
        console.log('📸 Screenshot: css-analysis-before.png');

        // Keep browser open for manual inspection
        console.log('\n🔍 Browser left open for manual inspection...');
        console.log('Press Ctrl+C to close when done.');
        
        // Wait indefinitely until user closes
        await new Promise(() => {});

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        
        if (error.message.includes('ERR_CONNECTION_REFUSED')) {
            console.log('\n💡 Development server not running at http://localhost:5175/');
            console.log('   Start with: cd frontend && npm run dev');
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Closing browser...');
    process.exit(0);
});

// Run the analysis
runCSSAnalysis().catch(console.error);