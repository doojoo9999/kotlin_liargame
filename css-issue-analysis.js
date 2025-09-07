const puppeteer = require('puppeteer');
const fs = require('fs');

async function quickCSSAnalysis() {
    console.log('🔍 Starting CSS Issue Analysis...');
    
    const browser = await puppeteer.launch({
        headless: false,
        devtools: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--disable-web-security']
    });

    const page = await browser.newPage();
    
    try {
        console.log('🌐 Navigating to http://localhost:5175/');
        await page.goto('http://localhost:5175/', { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
        });

        // Wait for React to load
        await page.waitForTimeout(3000);

        console.log('📊 Analyzing CSS...');
        
        const analysis = await page.evaluate(() => {
            const results = {
                whiteBorders: [],
                cssLoadStatus: {},
                tailwindStatus: false,
                errorElements: [],
                componentAnalysis: []
            };

            // Check for white borders
            const elements = document.querySelectorAll('*');
            let whiteBorderCount = 0;
            
            elements.forEach((el) => {
                const computed = getComputedStyle(el);
                const border = computed.border;
                const borderColor = computed.borderColor;
                
                // Check for white/transparent borders that shouldn't be there
                if (
                    border.includes('white') ||
                    border.includes('rgb(255, 255, 255)') ||
                    borderColor.includes('white') ||
                    borderColor.includes('rgb(255, 255, 255)')
                ) {
                    if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                        whiteBorderCount++;
                        if (whiteBorderCount <= 10) { // Limit for performance
                            results.whiteBorders.push({
                                tag: el.tagName.toLowerCase(),
                                classes: el.className,
                                id: el.id,
                                border: border,
                                borderColor: borderColor,
                                computed: {
                                    borderTop: computed.borderTopWidth + ' ' + computed.borderTopStyle + ' ' + computed.borderTopColor,
                                    borderRight: computed.borderRightWidth + ' ' + computed.borderRightStyle + ' ' + computed.borderRightColor,
                                    borderBottom: computed.borderBottomWidth + ' ' + computed.borderBottomStyle + ' ' + computed.borderBottomColor,
                                    borderLeft: computed.borderLeftWidth + ' ' + computed.borderLeftStyle + ' ' + computed.borderLeftColor
                                },
                                position: {
                                    x: el.offsetLeft,
                                    y: el.offsetTop,
                                    width: el.offsetWidth,
                                    height: el.offsetHeight
                                }
                            });
                        }
                    }
                }
            });

            // Check Tailwind loading
            let tailwindFound = false;
            const stylesheets = Array.from(document.styleSheets);
            
            stylesheets.forEach(sheet => {
                try {
                    if (sheet.href && sheet.href.includes('tailwind')) {
                        tailwindFound = true;
                    }
                    
                    const rules = sheet.cssRules || sheet.rules;
                    if (rules) {
                        for (let rule of rules) {
                            if (rule.selectorText && (
                                rule.selectorText.includes('.tw-') ||
                                rule.selectorText.includes('--tw-') ||
                                rule.cssText.includes('@tailwind')
                            )) {
                                tailwindFound = true;
                                break;
                            }
                        }
                    }
                } catch (e) {
                    // Cross-origin stylesheet
                }
            });
            
            results.tailwindStatus = tailwindFound;
            results.totalWhiteBorders = whiteBorderCount;

            // Check for common React components
            const reactComponents = document.querySelectorAll('[class*="Component"], [class*="Page"], [data-testid]');
            reactComponents.forEach((comp, index) => {
                if (index < 5) { // Limit for performance
                    const styles = getComputedStyle(comp);
                    results.componentAnalysis.push({
                        element: comp.tagName.toLowerCase(),
                        classes: comp.className,
                        testId: comp.getAttribute('data-testid'),
                        styles: {
                            display: styles.display,
                            background: styles.backgroundColor,
                            border: styles.border,
                            padding: styles.padding,
                            margin: styles.margin
                        }
                    });
                }
            });

            // Get page title for confirmation
            results.pageTitle = document.title;
            results.url = window.location.href;

            return results;
        });

        // Take screenshot
        await page.screenshot({ 
            path: 'css-analysis-screenshot.png',
            fullPage: true,
            quality: 90
        });

        console.log('\n=== CSS ANALYSIS RESULTS ===');
        console.log(`🌍 URL: ${analysis.url}`);
        console.log(`📄 Page Title: ${analysis.pageTitle}`);
        console.log(`🎨 Tailwind Detected: ${analysis.tailwindStatus ? '✅' : '❌'}`);
        console.log(`🔲 White Border Elements: ${analysis.totalWhiteBorders}`);

        if (analysis.whiteBorders.length > 0) {
            console.log('\n=== WHITE BORDER ELEMENTS ===');
            analysis.whiteBorders.forEach((elem, i) => {
                console.log(`${i + 1}. ${elem.tag}${elem.id ? '#' + elem.id : ''}${elem.classes ? '.' + elem.classes.replace(/\s+/g, '.') : ''}`);
                console.log(`   Border: ${elem.border}`);
                console.log(`   Color: ${elem.borderColor}`);
                console.log(`   Size: ${elem.position.width}x${elem.position.height}`);
                console.log(`   Position: (${elem.position.x}, ${elem.position.y})`);
                console.log('');
            });
        }

        if (analysis.componentAnalysis.length > 0) {
            console.log('\n=== REACT COMPONENTS ===');
            analysis.componentAnalysis.forEach((comp, i) => {
                console.log(`${i + 1}. ${comp.element} (${comp.classes})`);
                console.log(`   Display: ${comp.styles.display}`);
                console.log(`   Background: ${comp.styles.background}`);
                console.log(`   Border: ${comp.styles.border}`);
                console.log('');
            });
        }

        // Save detailed report
        fs.writeFileSync('css-analysis-report.json', JSON.stringify(analysis, null, 2));
        console.log('📄 Detailed report saved to: css-analysis-report.json');
        console.log('📸 Screenshot saved to: css-analysis-screenshot.png');

        // Generate fix recommendations
        const recommendations = [];
        
        if (analysis.totalWhiteBorders > 0) {
            recommendations.push("Remove white border from emergency CSS fixes - check css-fixes.css");
            recommendations.push("Check for conflicting border rules between Tailwind and custom CSS");
        }
        
        if (!analysis.tailwindStatus) {
            recommendations.push("Tailwind CSS may not be loading properly - check PostCSS configuration");
        }

        console.log('\n=== RECOMMENDATIONS ===');
        recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec}`);
        });

        return analysis;

    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Check if server is running
        const isServerRunning = await page.goto('http://localhost:5175/', { 
            waitUntil: 'domcontentloaded', 
            timeout: 5000 
        }).then(() => true).catch(() => false);
        
        if (!isServerRunning) {
            console.log('❌ Development server not accessible at http://localhost:5175/');
            console.log('💡 Make sure to run: cd frontend && npm run dev');
        }
    } finally {
        await browser.close();
    }
}

// Run analysis
quickCSSAnalysis().catch(console.error);