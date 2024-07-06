function initializePromptCreator() {
    const promptCreatorContainer = document.getElementById('prompt-creator-container');
    promptCreatorContainer.innerHTML = `
        <h2>Advanced Prompt Creator</h2>
        <select id="aiTool">
            <option value="">Select AI Tool</option>
            <option value="midjourney">Midjourney</option>
            <option value="dalle">DALL-E</option>
            <option value="chatgpt">ChatGPT</option>
            <option value="stable-diffusion">Stable Diffusion</option>
        </select>
        <input type="text" id="subject" placeholder="Enter the SUBJECT of your Prompt">
        <div id="parameterContainer" class="parameter-container"></div>
        <textarea id="generatedPrompt" placeholder="The PROMPT will be displayed here" readonly></textarea>
        <button id="generateButton">Generate Random Prompt</button>
        <button id="copyButton">Copy Prompt</button>
        <button id="resetButton">Reset</button>
    `;

    const aiTool = document.getElementById('aiTool');
    const subject = document.getElementById('subject');
    const parameterContainer = document.getElementById('parameterContainer');
    const generatedPrompt = document.getElementById('generatedPrompt');
    const generateButton = document.getElementById('generateButton');
    const copyButton = document.getElementById('copyButton');
    const resetButton = document.getElementById('resetButton');

    let currentParameters = {};

    async function loadParameters(tool) {
        try {
            const response = await fetch(`${tool}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const parameters = await response.json();
            createParameterInputs(parameters);
            currentParameters = parameters;
        } catch (error) {
            console.error("Could not load parameters:", error);
            parameterContainer.innerHTML = `<p>Error loading parameters for ${tool}. Please ensure ${tool}.json exists in the same directory as this HTML file.</p>`;
        }
    }

    function createParameterInputs(parameters) {
        parameterContainer.innerHTML = '';
        for (const [key, value] of Object.entries(parameters)) {
            const paramDiv = document.createElement('div');
            paramDiv.className = 'parameter';
            
            const mainSelect = document.createElement('select');
            mainSelect.innerHTML = `<option value="">${key}</option>`;
            
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = `Search ${key}...`;
            
            if (Array.isArray(value)) {
                // Simple parameter
                mainSelect.innerHTML += value.map(option => `<option value="${option}">${option}</option>`).join('');
                searchInput.addEventListener('input', (e) => filterOptions(mainSelect, e.target.value, value));
            } else {
                // Parameter with sub-parameters
                mainSelect.innerHTML += value.options.map(option => `<option value="${option}">${option}</option>`).join('');
                searchInput.addEventListener('input', (e) => filterOptions(mainSelect, e.target.value, value.options));
                
                const subSelect = document.createElement('select');
                subSelect.style.display = 'none';
                
                mainSelect.addEventListener('change', (e) => {
                    const selectedOption = e.target.value;
                    if (value['sub-parameters'] && value['sub-parameters'][selectedOption]) {
                        subSelect.innerHTML = `<option value="">Select ${selectedOption}</option>` +
                            value['sub-parameters'][selectedOption].map(subOption => `<option value="${subOption}">${subOption}</option>`).join('');
                        subSelect.style.display = 'block';
                    } else {
                        subSelect.style.display = 'none';
                    }
                });
                
                paramDiv.appendChild(subSelect);
            }
            
            paramDiv.appendChild(mainSelect);
            paramDiv.appendChild(searchInput);
            parameterContainer.appendChild(paramDiv);
        }
    }

    function filterOptions(select, query, allOptions) {
        const filteredOptions = allOptions.filter(option => 
            option.toLowerCase().includes(query.toLowerCase())
        );
        select.innerHTML = `<option value="">${select.firstElementChild.textContent}</option>` + 
            filteredOptions.map(value => `<option value="${value}">${value}</option>`).join('');
    }

    function generatePrompt() {
        let prompt = subject.value ? `${subject.value}, ` : '';
        const selectedParams = Array.from(parameterContainer.querySelectorAll('select'))
            .filter(select => select.value !== '')
            .map(select => select.value);

        if (selectedParams.length > 0) {
            prompt += selectedParams.join(', ');
        } else {
            // If no options are selected, choose random options
            prompt += Object.entries(currentParameters).map(([key, value]) => {
                if (Array.isArray(value)) {
                    return value[Math.floor(Math.random() * value.length)];
                } else {
                    const mainOption = value.options[Math.floor(Math.random() * value.options.length)];
                    if (value['sub-parameters'] && value['sub-parameters'][mainOption]) {
                        const subOptions = value['sub-parameters'][mainOption];
                        return `${mainOption} (${subOptions[Math.floor(Math.random() * subOptions.length)]})`;
                    }
                    return mainOption;
                }
            }).join(', ');
        }

        generatedPrompt.value = prompt;
    }

    aiTool.addEventListener('change', () => loadParameters(aiTool.value));
    generateButton.addEventListener('click', generatePrompt);
    copyButton.addEventListener('click', () => {
        generatedPrompt.select();
        document.execCommand('copy');
    });
    resetButton.addEventListener('click', () => {
        subject.value = '';
        generatedPrompt.value = '';
        aiTool.selectedIndex = 0;
        parameterContainer.innerHTML = '';
    });

    subject.addEventListener('input', generatePrompt);
    parameterContainer.addEventListener('change', generatePrompt);
}
