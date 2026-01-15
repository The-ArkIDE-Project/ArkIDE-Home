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
    
    const detectBackgroundColor = () => {
        try {
            // Check if we're on the /viewer page
            if (window.location.pathname === '/viewer') {
                backgroundColor = 'transparent';
                return true; // Stop the loop for viewer page
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
        
        // Stop if we found a valid color or reached max runs
        if (!foundColor && runCount < maxRuns) {
            timeoutId = setTimeout(runDetection, 500);
        }
    };
    
    const startDetectionLoop = () => {
        // Clear any existing interval or timeout
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
        
        // Check if we're on the /status page
        if (window.location.pathname === '/status') {
            // Update every second for status page
            detectStatusPageColor(); // Run immediately
            intervalId = setInterval(detectStatusPageColor, 1000);
        } else {
            // Reset counter and start normal detection loop
            runCount = 0;
            runDetection();
        }
    };
    
    onMount(() => {
        // Start the initial detection
        startDetectionLoop();
        
        // Cleanup
        return () => {
            if (intervalId) clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
        };
    });
</script>

<div style="height: 3rem; background: {backgroundColor}" />