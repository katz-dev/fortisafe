// Function to check if a form is a registration form
function isRegistrationForm(form) {
    const formText = form.textContent.toLowerCase();
    const formAction = form.action?.toLowerCase() || '';
    const formId = form.id?.toLowerCase() || '';
    const formClass = form.className?.toLowerCase() || '';

    const registrationKeywords = [
        'register', 'signup', 'sign up', 'create account',
        'new account', 'registration', 'sign-up'
    ];

    return registrationKeywords.some(keyword =>
        formText.includes(keyword) ||
        formAction.includes(keyword) ||
        formId.includes(keyword) ||
        formClass.includes(keyword)
    );
}

// Function to extract form data
function extractFormData(form) {
    const formData = {
        email: '',
        username: '',
        password: '',
        url: window.location.href,
        timestamp: new Date().toISOString()
    };

    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        const type = input.type.toLowerCase();
        const name = input.name?.toLowerCase() || '';
        const id = input.id?.toLowerCase() || '';
        const placeholder = input.placeholder?.toLowerCase() || '';

        if (type === 'email' || name.includes('email') || id.includes('email') || placeholder.includes('email')) {
            formData.email = input.value;
        }
        if (type === 'text' && (name.includes('user') || id.includes('user') || placeholder.includes('username'))) {
            formData.username = input.value;
        }
        if (type === 'password') {
            formData.password = input.value;
        }
    });

    return formData;
}

// Main form detection logic
function detectRegistrationForms() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        if (isRegistrationForm(form)) {
            // Add submit event listener
            form.addEventListener('submit', (event) => {
                const formData = extractFormData(form);

                // Only send data if we found relevant fields
                if (formData.email || formData.username || formData.password) {
                    // Send message to background script
                    chrome.runtime.sendMessage({
                        type: 'REGISTRATION_FORM_DETECTED',
                        data: formData
                    });
                }
            });
        }
    });
}

// Run detection when page loads
detectRegistrationForms();

// Also run detection when DOM changes (for dynamically loaded forms)
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            detectRegistrationForms();
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
}); 