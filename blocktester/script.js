// Function to handle testing all URLs in parallel
async function startTesting() {
    const container = document.getElementById('results');
    container.innerHTML = ''; // Clear previous results

    try {
        // Fetch the urls.txt file from the current directory
        const response = await fetch('urls.txt');
        if (!response.ok) {
            container.innerHTML = 'Failed to load URLs from urls.txt';
            return;
        }

        const text = await response.text();

        // Split the file content into an array of URLs
        const urls = text.split('\n').map(url => url.trim()).filter(url => url !== '');
        
        if (urls.length === 0) {
            container.innerHTML = 'No URLs found in urls.txt!';
            return;
        }

        // Display message indicating the start of testing
        container.innerHTML = 'Starting tests...';

        // Handle testing all URLs concurrently using Promise.all
        const results = await Promise.all(urls.map(url => checkUrl(url)));

        // Display the results
        results.forEach((result, index) => {
            const resultDiv = document.createElement('div');
            resultDiv.textContent = `Testing ${urls[index]}... ${result.status}`;
            resultDiv.className = result.status.toLowerCase().replace(/\s+/g, '-');
            container.appendChild(resultDiv);
        });
    } catch (error) {
        console.error('Error fetching urls.txt:', error);
        container.innerHTML = 'Error loading the URL list.';
    }
}

// Function to check the URL status (unblocked/block/redirect)
async function checkUrl(url) {
    const corsProxyUrl = 'https://checkproxy.dashbenton.com/proxy?url='; // Ensure this is HTTPS
    const proxiedUrl = corsProxyUrl + encodeURIComponent(url);

    try {
        const response = await fetch(proxiedUrl, {
            method: 'GET',
            redirect: 'follow',
            timeout: 5000, // Timeout set to 5 seconds for each request
        });

        if (response.status >= 200 && response.status < 300) {
            return { status: 'Unblocked' };
        } else if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('Location');
            if (location && location.startsWith('chrome-extension://')) {
                return { status: 'Blocked (Redirect to Chrome Extension)' };
            } else {
                return { status: 'Unblocked (Redirect)' };
            }
        } else {
            return { status: `Blocked (Status: ${response.status})` };
        }
    } catch (error) {
        // Handle different types of errors
        if (error.name === 'AbortError') {
            return { status: 'Blocked (Timeout)' };
        }
        return { status: `Blocked (Error: ${error.message})` };
    }
}
