/**
 * ALTCHA Invisible CAPTCHA Demo Application
 * Handles widget events, form submission, and UI state management
 */

class AltchaDemo {
    constructor() {
        this.widget = null;
        this.accessBtn = null;
        this.captchaState = 'unverified';
        this.altchaPayload = null;
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Get DOM elements
        this.widget = document.getElementById('altcha-widget');
        this.accessBtn = document.getElementById('access-btn');
        
        if (!this.widget || !this.accessBtn) {
            console.error('Required DOM elements not found');
            return;
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Update UI state
        this.updateCaptchaStatus('unverified', 'Loading CAPTCHA...');
        
        // Also add a general error handler for unhandled widget errors
        window.addEventListener('error', (e) => {
            console.error('Global error that might be widget related:', e);
        });
        
        console.log('ALTCHA Demo initialized');
    }

    setupEventListeners() {
        // ALTCHA verification complete
        this.widget.addEventListener('verified', (event) => {
            this.handleVerified(event);
        });

        // ALTCHA error events
        this.widget.addEventListener('error', (event) => {
            this.handleError(event);
        });

        // Access button click
        this.accessBtn.addEventListener('click', () => {
            this.handleAccessRequest();
        });
    }

    handleVerified(event) {
        this.captchaState = 'verified';
        this.altchaPayload = event.detail.payload;
        this.setButtonState(true, 'Access Protected Content');
        this.showSpinner(false);
        this.updateCaptchaStatus('verified', 'Verified ✓');
    }

    handleError(event) {
        console.error('CAPTCHA error:', event.detail);
        this.showError(`CAPTCHA Error: ${event.detail.message || 'Unknown error occurred'}`);
    }

    async handleAccessRequest() {
        console.log('Access request initiated');
        if (this.captchaState !== 'verified' || !this.altchaPayload) {
            this.showError('Please wait for CAPTCHA verification to complete.');
            return;
        }

        // Show loading state
        this.setButtonState(false, 'Accessing protected content...');
        this.showSpinner(true);

        try {
            const response = await fetch('/api/protected', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    altcha: this.altchaPayload
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showSuccess(data.message);
            } else {
                throw new Error(data.error || 'Failed to access protected content');
            }

        } catch (error) {
            console.error('Error accessing protected content:', error);
            this.showError(`Failed to access protected content: ${error.message}`);
        } finally {
            this.setButtonState(true, 'Access Protected Content');
            this.showSpinner(false);
        }
    }

    // UI Helper Methods
    updateCaptchaStatus(state, message) {
        console.log(`Updating CAPTCHA status: ${state} - ${message}`);
    }

    setButtonState(enabled, text) {
        if (!this.accessBtn) return;
        
        this.accessBtn.disabled = !enabled;
        const btnText = document.getElementById('btn-text');
        if (btnText) {
            btnText.innerHTML = `<i class="me-2"></i>${text}`;
        }
    }

    showSpinner(show = true) {
        const spinner = document.getElementById('btn-spinner');
        if (spinner) {
            spinner.style.display = show ? 'inline-block' : 'none';
        }
    }

    showSuccess(message) {
        console.log(message)
    }

    showError(message) {
        console.error(message);
    }
}

// Initialize the application
const altchaDemo = new AltchaDemo();
