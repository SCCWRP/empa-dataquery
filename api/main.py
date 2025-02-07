import os
from flask import Blueprint, jsonify, render_template, flash, send_from_directory, session, request

from .utils import requires_auth

# Create a Blueprint for the login
homepage = Blueprint('homepage', __name__)

# Main app page
@homepage.route('/', defaults={'path': ''}, methods = ['GET','POST'])
@homepage.route('/<path:path>', methods = ['GET','POST'])
#@requires_auth
def main(path):            
    return render_template('app.jinja2')
    
    
# For the favicon.ico
@homepage.route('/favicon', methods = ['GET'])
def icon():
    return send_from_directory('static','icons/orange.png')

# Route to serve loader.gif
@homepage.route('/assets/<filename>', methods=['GET'])
def serve_asset(filename):
    return send_from_directory('static', f'icons/{filename}')


@homepage.errorhandler(Exception)
def homepage_error_handler(error):
    print(error)
    return jsonify({"error" : str(error)})
