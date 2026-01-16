<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    
    let backgroundColor = "rgba(0, 0, 0, 0.1)"; // default fallback
    
    // Reactive statement that triggers whenever the page route changes
    $: if (browser && $page.url.pathname) {
        startDetectionLoop();
    }
    
    let intervalId = null;
    let timeoutId = null;
    
    const isUserLoggedIn = () => {
        const bodyText = document.body.innerText || document.body.textContent;
        return !bodyText.includes("Sign up"); 
    };
    
    const detectBackgroundColor = () => {
        try {
            // Check if we're on the /viewer or /profile page
            if (window.location.pathname === '/viewer' || window.location.pathname.startsWith('/profile')) {
                backgroundColor = 'transparent';
                return true; // Stop the loop for viewer/profile page
            }
            
            // Get center X coordinate, 80px down from top
            const x = 50;
            const y = 80;
            
            // Get the element at that position
            const element = document.elementFromPoint(x, y);
            
            if (element) {
                // Get the computed background color of that element
                let bgColor = window.getComputedStyle(element).backgroundColor;
                
                // If transparent, traverse up the DOM tree
                let currentElement = element;
                while ((!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') && currentElement.parentElement) {
                    currentElement = currentElement.parentElement;
                    bgColor = window.getComputedStyle(currentElement).backgroundColor;
                }
                
                // Use the color as-is (rgb, rgba, or hex)
                if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                    backgroundColor = bgColor;
                    
                    // Check if it's a valid non-black color
                    // Parse rgb/rgba to check if it's not black
                    const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                    if (match) {
                        const [, r, g, b] = match;
                        // Return true if it's not black (0,0,0)
                        if (r !== '0' || g !== '0' || b !== '0') {
                            return true; // Successfully found a non-black color
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error detecting background color:', error);
        }
        return false; // Did not find a valid color
    };
    
    const detectStatusPageColor = () => {
        try {
            const sectionInfo = document.querySelector('.section-info');
            if (sectionInfo) {
                const bgColor = window.getComputedStyle(sectionInfo).backgroundColor;
                if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                    backgroundColor = bgColor;
                }
            }
        } catch (error) {
            console.error('Error detecting status page color:', error);
        }
    };
    
    let runCount = 0;
    const maxRuns = 10;
    
    const runDetection = () => {
        const foundColor = detectBackgroundColor();
        runCount++;
        
        if (!foundColor && runCount < maxRuns) {
            timeoutId = setTimeout(runDetection, 500);
        }
    };
    

    let homeRunCount = 0;
    const maxHomeRuns = 5;
    
    const runHomeDetection = () => {
        detectBackgroundColor();
        homeRunCount++;
        
        if (homeRunCount < maxHomeRuns) {
            const match = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                const [, r, g, b] = match;
                if (homeRunCount >= 1 && (r !== '0' || g !== '0' || b !== '0')) {
                    return; 
                }
            }
            timeoutId = setTimeout(runHomeDetection, 800);
        }
    };
    
    const startDetectionLoop = () => {
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
        
        // Homepage special handling
        if (window.location.pathname === '/') {
            // Wait 1000ms before checking login status and setting color
            timeoutId = setTimeout(() => {
                // Check if "Sign up" exists on the page
                if (isUserLoggedIn()) {
                    const isDarkMode = document.body.classList.contains('dark-mode');
                    backgroundColor = isDarkMode ? 'rgb(17, 17, 17)' : 'rgb(255, 255, 255)';
                } else {
                    // User is not logged in ("Sign up" exists), run normal detection
                    homeRunCount = 0;
                    runHomeDetection();
                }
            }, 1000);
        }
        else if (window.location.pathname === '/status') {
            detectStatusPageColor(); 
            intervalId = setInterval(detectStatusPageColor, 1000);
        } else {
            runCount = 0;
            runDetection();
        }
    };
    
    onMount(() => {
        // Start the initial detection
        startDetectionLoop();
        
        const observer = new MutationObserver(() => {
            if (window.location.pathname === '/' && isUserLoggedIn()) {
                const isDarkMode = document.body.classList.contains('dark-mode');
                backgroundColor = isDarkMode ? 'rgb(17, 17, 17)' : 'rgb(255, 255, 255)';
            }
        });
        
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        // Cleanup
        return () => {
            if (intervalId) clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
            observer.disconnect();
        };
    });
</script>

<div style="height: 3.5rem; background: {backgroundColor}" />