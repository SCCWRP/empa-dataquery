import pandas as pd
import os, traceback
from flask import Blueprint, request, Response, make_response, current_app, jsonify
from functools import wraps
from .mail import send_mail

# Basic Authentication Function
def check_auth(username, password):
    """This function is called to check if a username /
    password combination is valid."""
    return username == 'sccwrp' and password == os.environ.get("APP_PW")

def authenticate():
    """Sends a 401 response that enables basic auth"""
    return make_response(
        'This application is intended for an authorized user only.\n'
        'You have to login with proper credentials', 401,
        {'WWW-Authenticate': 'Basic realm="Login Required"'})

def requires_auth(f):
    """Determines if the basic auth is correct"""
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated


def get_primary_key(tablename, eng):
    # eng is a sqlalchemy database connection
    # This query gets us the primary keys of a table. Not in a python friendly format
    # Copy paste to Navicat, pgadmin, or do a pd.read_sql to see what it gives
    pkey_query = f"""
        WITH tmp AS (
            SELECT
                C.COLUMN_NAME,
                C.data_type
            FROM
                information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage AS ccu USING (CONSTRAINT_SCHEMA, CONSTRAINT_NAME)
                JOIN information_schema.COLUMNS AS C ON C.table_schema = tc.CONSTRAINT_SCHEMA
                AND tc.TABLE_NAME = C.TABLE_NAME
                AND ccu.COLUMN_NAME = C.COLUMN_NAME
            WHERE
                constraint_type = 'PRIMARY KEY'
                AND tc.TABLE_NAME = '{tablename}'
        )
        SELECT
            tmp.COLUMN_NAME,
            tmp.data_type,
            column_order.custom_column_position
        FROM
            tmp
            LEFT JOIN (
                SELECT
                    COLUMN_NAME,
                    custom_column_position
                FROM
                    column_order
                WHERE
                    TABLE_NAME = '{tablename}'
            ) column_order ON column_order."column_name" = tmp.COLUMN_NAME
                ORDER BY
                custom_column_position
    """
    pkey_df = pd.read_sql(pkey_query, eng)
    
    pkey = pkey_df.column_name.tolist() if not pkey_df.empty else []
    
    return pkey

def find_key_by_label(dictionary, target_label):
    for key, value in dictionary.items():
        if isinstance(value, dict) and value.get("label") == target_label:
            return key
    return None

def error_handler(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            # Log the error
            current_app.logger.error(f"Error occurred: {e}")
            current_app.logger.error(traceback.format_exc())

            # Send an error email
            err_msg = f"THERE WAS A CRITICAL ERROR:\n {e}\n {request.get_json()}"
            send_mail(
                current_app.mail_from, 
                current_app.maintainers, 
                'EMPA Advanced Data Query ERROR', 
                err_msg, 
                filename=None, 
                server=current_app.config['MAIL_SERVER']
            )

            # Return a JSON response with the error
            return jsonify(error=str(e)), 500
    return decorated_function
