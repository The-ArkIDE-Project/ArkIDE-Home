<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    
    let backgroundColor = "rgba(0, 0, 0, 0.1)";
    
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
            if (window.location.pathname === '/viewer' || window.location.pathname.startsWith('/profile')) {
                backgroundColor = 'transparent';
                return true; 
            }
            

            const x = 50;
            const y = 80;
            
            const element = document.elementFromPoint(x, y);
            
            if (element) {
                let bgColor = window.getComputedStyle(element).backgroundColor;
                
                let currentElement = element;
                while ((!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') && currentElement.parentElement) {
                    currentElement = currentElement.parentElement;
                    bgColor = window.getComputedStyle(currentElement).backgroundColor;
                }
                
                if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                    backgroundColor = bgColor;
                    
                    const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                    if (match) {
                        const [, r, g, b] = match;
                        if (r !== '0' || g !== '0' || b !== '0') {
                            return true; 
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error detecting background color:', error);
        }
        return false; 
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
        
        if (window.location.pathname === '/') {
            timeoutId = setTimeout(() => {
                if (isUserLoggedIn()) {
                    const isDarkMode = document.body.classList.contains('dark-mode');
                    backgroundColor = isDarkMode ? 'rgb(17, 17, 17)' : 'rgb(255, 255, 255)';
                } else {
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

<!-- <div style="height: 3rem; background: {backgroundColor}" /> -->
 <div style="height: 3.2rem; background: #000000" />