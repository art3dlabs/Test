document.addEventListener('DOMContentLoaded', () => {
    const pngInput = document.getElementById('pngInput');
    const metadataDisplay = document.getElementById('metadata-display');
    const copyDataBtn = document.getElementById('copyDataBtn');
    const imagePreview = document.createElement('img');
    imagePreview.style.maxWidth = '300px';
    imagePreview.style.maxHeight = '300px';
    metadataDisplay.parentNode.insertBefore(imagePreview, metadataDisplay);

    pngInput.addEventListener('change', handlePNGUpload);
    copyDataBtn.addEventListener('click', copyMetadata);


    // Add this new section to handle tool switching
    const toolLinks = document.querySelectorAll('nav ul li a');
    const toolContent = document.getElementById('tool-content');
    const pngMetadataReader = document.getElementById('png-metadata-reader');
    const promptCreatorContainer = document.getElementById('prompt-creator-container');

    toolLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tool = e.target.getAttribute('data-tool');
            
            // Hide all tool containers
            pngMetadataReader.style.display = 'none';
            promptCreatorContainer.style.display = 'none';

            // Show the selected tool
            if (tool === 'prompt-creator') {
                promptCreatorContainer.style.display = 'block';
                initializePromptCreator(); // This function will be defined in prompt-creator.js
            } else {
                pngMetadataReader.style.display = 'block';
            }
        });
    });


    function handlePNGUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'image/png') {
            const reader = new FileReader();
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
                const metadata = extractPNGMetadata(arrayBuffer);
                displayMetadata(metadata);
                
                // Display image preview
                const urlReader = new FileReader();
                urlReader.onload = function(e) {
                    imagePreview.src = e.target.result;
                };
                urlReader.readAsDataURL(file);
            };
            reader.readAsArrayBuffer(file);
        } else {
            metadataDisplay.textContent = 'Please upload a valid PNG file.';
            imagePreview.src = '';
        }
    }

    function extractPNGMetadata(arrayBuffer) {
        const view = new DataView(arrayBuffer);
        let offset = 8; // Skip PNG signature
        const metadata = {};

        while (offset < arrayBuffer.byteLength) {
            const length = view.getUint32(offset);
            offset += 4;
            const type = String.fromCharCode(
                view.getUint8(offset),
                view.getUint8(offset + 1),
                view.getUint8(offset + 2),
                view.getUint8(offset + 3)
            );
            offset += 4;

            if (type === 'tEXt') {
                const textData = new TextDecoder().decode(new Uint8Array(arrayBuffer, offset, length));
                const [keyword, ...textParts] = textData.split('\0');
                const text = textParts.join('\0');
                if (!metadata[keyword]) {
                    metadata[keyword] = text;
                } else if (Array.isArray(metadata[keyword])) {
                    metadata[keyword].push(text);
                } else {
                    metadata[keyword] = [metadata[keyword], text];
                }
            }

            offset += length + 4; // Skip CRC
        }

        return metadata;
    }

    function displayMetadata(metadata) {
        let highlightedHtml = '<h3>Key AI Generation Parameters:</h3>';
        let otherHtml = '<h3>Other Metadata:</h3>';

        const highlightedParams = [
            'parameters', 'Negative prompt', 'Steps', 'Sampler', 
            'CFG scale', 'Seed', 'Size', 'Model hash', 'Lora', 'Model'
        ];

        highlightedParams.forEach(param => {
            if (metadata[param]) {
                highlightedHtml += formatHighlightedParameter(param, metadata[param]);
                delete metadata[param];
            }
        });

        // Display any other metadata
        Object.keys(metadata).forEach(key => {
            otherHtml += formatParameter(key, metadata[key]);
        });

        metadataDisplay.innerHTML = highlightedHtml + '<hr>' + otherHtml;
    }

    function formatHighlightedParameter(key, value) {
        return `<div class="highlighted-param">
                    <strong>${key}:</strong>
                    <pre>${escapeHtml(value)}</pre>
                </div>`;
    }

    function formatParameter(key, value) {
        let formattedValue = value;
        if (typeof value === 'string' && value.includes('{')) {
            try {
                const jsonObj = JSON.parse(value);
                formattedValue = '<pre>' + JSON.stringify(jsonObj, null, 2) + '</pre>';
            } catch (e) {
                // If parsing fails, use the original string
            }
        }
        return `<div><strong>${key}:</strong> ${formattedValue}</div>`;
    }

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    function copyMetadata() {
        const highlightedParams = document.querySelectorAll('.highlighted-param');
        let copyText = '';
        highlightedParams.forEach(param => {
            copyText += param.textContent.trim() + '\n';
        });
        navigator.clipboard.writeText(copyText).then(() => {
            alert('Key parameters copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy metadata: ', err);
        });
    }

    // Quick Access Toolbar (unchanged)
    const quickAccessTools = [
        { name: 'Color Picker', icon: '🎨' },
        { name: 'Text Editor', icon: '📝' },
        { name: 'Calculator', icon: '🧮' }
    ];

    const quickAccessToolbar = document.getElementById('quick-access-toolbar');
    quickAccessTools.forEach(tool => {
        const button = document.createElement('button');
        button.innerHTML = `${tool.icon} ${tool.name}`;
        button.addEventListener('click', () => alert(`${tool.name} clicked!`));
        quickAccessToolbar.appendChild(button);
    });
});
