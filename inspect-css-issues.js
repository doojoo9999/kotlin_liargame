const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function inspectCSSIssues() {
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    try {
        console.log('🔍 Connecting to http://localhost:5175/...');
        await page.goto('http://localhost:5175/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        console.log('📸 Taking screenshot...');
        await page.screenshot({ path: 'css-inspection-screenshot.png', fullPage: true });

        // Wait for React components to load
        await page.waitForTimeout(2000);

        console.log('🔎 Analyzing CSS issues...');
        
        const cssAnalysis = await page.evaluate(() => {
            const results = {
                whiteBorderElements: [],
                missingStyles: [],
                tailwindIssues: [],
                globalCSSConflicts: [],
                componentStyles: []
            };

            // Find elements with white borders
            const allElements = document.querySelectorAll('*');
            allElements.forEach((el, index) => {
                const styles = window.getComputedStyle(el);
                const borderColor = styles.borderColor;
                const border = styles.border;
                
                // Check for white borders
                if (borderColor.includes('255, 255, 255') || 
                    borderColor === 'white' || 
                    border.includes('white') ||
                    border.includes('rgb(255, 255, 255)')) {
                    
                    const elementInfo = {
                        tag: el.tagName.toLowerCase(),
                        className: el.className,
                        id: el.id,
                        border: border,
                        borderColor: borderColor,
                        borderWidth: styles.borderWidth,
                        borderStyle: styles.borderStyle,
                        position: {
                            top: el.offsetTop,
                            left: el.offsetLeft,
                            width: el.offsetWidth,
                            height: el.offsetHeight
                        },
                        selector: el.tagName.toLowerCase() + 
                                 (el.id ? '#' + el.id : '') + 
                                 (el.className ? '.' + el.className.replace(/\s+/g, '.') : ''),
                        parentElement: el.parentElement ? el.parentElement.tagName.toLowerCase() : null
                    };
                    
                    if (elementInfo.position.width > 0 && elementInfo.position.height > 0) {
                        results.whiteBorderElements.push(elementInfo);
                    }
                }
            });

            // Check for Tailwind CSS loading
            const stylesheets = Array.from(document.styleSheets);
            let tailwindLoaded = false;
            let customCSSLoaded = false;
            
            stylesheets.forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || sheet.rules || []);
                    rules.forEach(rule => {
                        if (rule.selectorText && rule.selectorText.includes('tw-')) {
                            tailwindLoaded = true;
                        }
                        if (rule.href && (rule.href.includes('index.css') || rule.href.includes('main.css'))) {
                            customCSSLoaded = true;
                        }
                    });
                } catch (e) {
                    // CORS issues with external stylesheets
                }
            });

            results.tailwindIssues.push({
                tailwindLoaded,
                customCSSLoaded,
                totalStylesheets: stylesheets.length
            });

            // Check for common React component styling issues
            const reactComponents = document.querySelectorAll('[data-react-component], [class*="Component"], [class*="Page"]');
            reactComponents.forEach(component => {
                const styles = window.getComputedStyle(component);
                results.componentStyles.push({
                    element: component.tagName.toLowerCase(),
                    className: component.className,
                    display: styles.display,
                    position: styles.position,
                    zIndex: styles.zIndex,
                    backgroundColor: styles.backgroundColor,
                    color: styles.color,
                    padding: styles.padding,
                    margin: styles.margin,
                    border: styles.border
                });
            });

            // Check for global CSS conflicts
            const bodyStyles = window.getComputedStyle(document.body);
            const htmlStyles = window.getComputedStyle(document.documentElement);
            
            results.globalCSSConflicts.push({
                body: {
                    backgroundColor: bodyStyles.backgroundColor,
                    color: bodyStyles.color,
                    fontFamily: bodyStyles.fontFamily,
                    margin: bodyStyles.margin,
                    padding: bodyStyles.padding,
                    border: bodyStyles.border
                },
                html: {
                    backgroundColor: htmlStyles.backgroundColor,
                    color: htmlStyles.color,
                    fontFamily: htmlStyles.fontFamily,
                    margin: htmlStyles.margin,
                    padding: htmlStyles.padding,
                    border: htmlStyles.border
                }
            });

            return results;
        });

        // Check network requests for CSS files
        console.log('🌐 Checking network requests...');
        const cssRequests = await page.evaluate(() => {
            return performance.getEntriesByType('resource')
                .filter(entry => entry.name.includes('.css') || entry.name.includes('style'))
                .map(entry => ({
                    name: entry.name,
                    status: entry.responseStatus || 'unknown',
                    size: entry.transferSize,
                    duration: entry.duration
                }));
        });

        // Get console errors
        const consoleMessages = [];
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                consoleMessages.push({
                    type: msg.type(),
                    text: msg.text(),
                    location: msg.location()
                });
            }
        });

        // Wait a bit more to catch any console messages
        await page.waitForTimeout(3000);

        const report = {
            timestamp: new Date().toISOString(),
            url: 'http://localhost:5175/',
            cssAnalysis,
            cssRequests,
            consoleMessages: consoleMessages.filter(msg => 
                msg.text.toLowerCase().includes('css') || 
                msg.text.toLowerCase().includes('style') ||
                msg.text.toLowerCase().includes('tailwind')
            ),
            recommendations: []
        };

        // Generate recommendations based on findings
        if (report.cssAnalysis.whiteBorderElements.length > 0) {
            report.recommendations.push({
                issue: 'White borders detected',
                count: report.cssAnalysis.whiteBorderElements.length,
                solution: 'Check for global CSS rules applying white borders, possibly from reset.css or component libraries'
            });
        }

        if (!report.cssAnalysis.tailwindIssues[0].tailwindLoaded) {
            report.recommendations.push({
                issue: 'Tailwind CSS not properly loaded',
                solution: 'Verify PostCSS configuration and Tailwind import in main CSS file'
            });
        }

        if (report.cssRequests.some(req => req.status !== 200)) {
            report.recommendations.push({
                issue: 'CSS files not loading properly',
                failedRequests: report.cssRequests.filter(req => req.status !== 200),
                solution: 'Check network tab for failed CSS requests and fix file paths'
            });
        }

        // Save detailed report
        const reportPath = path.join(process.cwd(), 'css-inspection-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('📊 Analysis complete!');
        console.log(`📄 Full report saved to: ${reportPath}`);
        console.log(`📸 Screenshot saved to: css-inspection-screenshot.png`);
        
        // Print summary
        console.log('\n=== CSS ISSUE SUMMARY ===');
        console.log(`🔴 White border elements found: ${report.cssAnalysis.whiteBorderElements.length}`);
        console.log(`🎨 Tailwind loaded: ${report.cssAnalysis.tailwindIssues[0].tailwindLoaded}`);
        console.log(`📁 CSS files loaded: ${report.cssRequests.length}`);
        console.log(`⚠️  Console errors: ${report.consoleMessages.length}`);
        
        if (report.cssAnalysis.whiteBorderElements.length > 0) {
            console.log('\n=== WHITE BORDER ELEMENTS ===');
            report.cssAnalysis.whiteBorderElements.slice(0, 10).forEach((el, i) => {
                console.log(`${i + 1}. ${el.selector}`);
                console.log(`   Border: ${el.border}`);
                console.log(`   Size: ${el.position.width}x${el.position.height}`);
                console.log('');
            });
        }

        console.log('\n=== RECOMMENDATIONS ===');
        report.recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec.issue}`);
            console.log(`   Solution: ${rec.solution}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error during inspection:', error.message);
        
        // Try to get some basic info even if main inspection fails
        try {
            const title = await page.title();
            console.log('📄 Page title:', title);
            
            const url = page.url();
            console.log('🌐 Current URL:', url);
        } catch (e) {
            console.error('❌ Could not connect to localhost:5175');
            console.log('💡 Make sure your development server is running with: npm run dev');
        }
    } finally {
        await browser.close();
    }
}

// Run the inspection
inspectCSSIssues().catch(console.error);