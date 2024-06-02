import os
from flask import Blueprint, jsonify, render_template, flash, send_from_directory, session, request

from .utils import requires_auth

# Create a Blueprint for the login
homepage = Blueprint('homepage', __name__)

# Main app page
@homepage.route('/', defaults={'path': ''}, methods = ['GET','POST'])
@homepage.route('/<path:path>', methods = ['GET','POST'])
@requires_auth
def main(path):
    # if path == 'login':
    #     if request.method == 'POST':
    #         data = request.json
    #         pw = data.get('pw')
    #         correct_pw = (pw == os.getenv("APP_PW"))
    #         session['AUTHORIZED'] = correct_pw
    #         if True:
    #             return jsonify({"message":"success", "redirectLocation": request.script_root})
                
    #         return jsonify({"error":"Login Failed"})
    #     else:
    #         return render_template('login.jinja2')
    
    # if path == 'data':
        
    
    # if not session.get('AUTHORIZED'):
    #     return render_template('login.jinja2')
            
    return render_template('app.jinja2')
    
    
# For the favicon.ico
@homepage.route('/favicon', methods = ['GET'])
def icon():
    return send_from_directory('static','icons/orange.png')


@homepage.errorhandler(Exception)
def homepage_error_handler(error):
    print(error)
    return jsonify({"error" : str(error)})
