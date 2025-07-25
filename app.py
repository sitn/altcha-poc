import os
import logging
import datetime
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from altcha import create_challenge, verify_solution, ChallengeOptions

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

CORS(app)

HMAC_KEY = os.environ.get("ALTCHA_HMAC_KEY", "demo-hmac-key-change-in-production")

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')

@app.route('/api/challenge', methods=['GET'])
def get_challenge():
    """Generate a new ALTCHA challenge"""
    try:
        # Create challenge with proper ChallengeOptions
        options = ChallengeOptions(
            hmac_key=HMAC_KEY,
            max_number=300000,  # Complexity level -> higher = more work
            expires=datetime.datetime.now() + datetime.timedelta(minutes=5)
        )
        challenge = create_challenge(options)
        
        # Convert challenge object to dictionary for JSON response
        challenge_dict = {
            'algorithm': challenge.algorithm,
            'challenge': challenge.challenge,
            'maxnumber': challenge.max_number,
            'salt': challenge.salt,
            'signature': challenge.signature
        }
        
        logger.debug(f"Generated challenge: {challenge_dict}")
        return jsonify(challenge_dict)
        
    except Exception as e:
        logger.error(f"Failed to create challenge: {str(e)}")
        return jsonify({'error': 'Failed to create challenge'}), 500

@app.route('/api/protected', methods=['POST'])
def get_protected_content():
    """Protected endpoint that returns content only after CAPTCHA verification"""
    try:
        # Get ALTCHA payload from request
        altcha_payload = None
        if request.is_json and request.json:
            altcha_payload = request.json.get('altcha')
        elif request.form:
            altcha_payload = request.form.get('altcha')
        
        if not altcha_payload:
            logger.warning("No ALTCHA payload provided")
            return jsonify({'error': 'CAPTCHA verification required'}), 400
        
        # Verify the ALTCHA solution
        logger.debug(f"Verifying payload: {altcha_payload}")
        is_valid, error_msg = verify_solution(altcha_payload, HMAC_KEY, check_expires=True)
        
        if not is_valid:
            logger.warning(f"Invalid ALTCHA solution: {error_msg}")
            return jsonify({'error': f'Invalid CAPTCHA verification: {error_msg}'}), 403
        
        # Return protected content
        logger.info("CAPTCHA verified successfully, returning protected content")
        return jsonify({
            'success': True,
            'message': 'Hello World!',
            'timestamp': os.times().elapsed
        })
        
    except Exception as e:
        logger.error(f"Error in protected endpoint: {str(e)}")
        return jsonify({'error': 'Verification failed'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'altcha-demo'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
