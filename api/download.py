import traceback
import pandas as pd
from flask import Blueprint, request, render_template, jsonify, g, current_app, send_file
import os
import json
from zipfile import ZipFile
from datetime import datetime
import time
from .utils import get_primary_key

download = Blueprint('download', __name__, template_folder = 'templates')
@download.route('/downloaddata', methods = ['GET','POST'])
def download_data():
    request_data = request.get_json()  # Retrieve the JSON data from the request body
    cleaned_data = {k: v for k, v in request_data.items() if v}

    # Extract dtype separately
    dtypes = cleaned_data.pop('dtype', None)

    # Build WHERE clause
    where_conditions = []
    for key, values in cleaned_data.items():
        if isinstance(values, list):
            values_str = "', '".join(values)
            where_conditions.append(f"s.{key} IN ('{values_str}')")
        else:
            where_conditions.append(f"s.{key} = '{values}'")

    where_clause = " AND ".join(where_conditions)
    print("WHERE clause:", where_clause)
    
    requestid = int(time.time())
    export_path = os.path.join(os.getcwd(), "api", "export")
    
    excel_files = []
    for dtype in dtypes:
        tbls = current_app.datasets.get(dtype, [])
        excel_file_path = os.path.join(export_path, f'{dtype}.xlsx')
        with pd.ExcelWriter(excel_file_path) as writer:
            for tbl in tbls:
                pkey = get_primary_key(tbl, g.eng)
                if tbl == 'tbl_protocol_metadata':
                    continue
                else:
                    cols = pd.read_sql(f"""
                        SELECT column_name 
                        FROM column_order 
                        WHERE table_name = '{tbl}' 
                        ORDER BY custom_column_position
                    """, g.eng).column_name.tolist()
                    query = f"""
                        SELECT t.* 
                        FROM {tbl} t
                        JOIN search s ON t.estuaryname = s.estuaryname AND t.siteid = s.siteid
                    """
                    if where_clause:
                        query += f" WHERE {where_clause}"
                    print(query)
                    df = pd.read_sql(query, g.eng)
                    print(cols)
                    print(list(df.columns))
                    
                    # arrange columns
                    df = df[[col for col in cols if (col in list(df.columns)) and (col not in current_app.system_fields)]]
                    df.sort_values(pkey).to_excel(writer, sheet_name=tbl, index=False)
        excel_files.append(excel_file_path)

    zip_file_path = f'{export_path}/data-{requestid}.zip'
    with ZipFile(zip_file_path, 'w') as zipf:
        for file in excel_files:
            zipf.write(file, os.path.basename(file))

    # Clean up Excel files after zipping
    for file in excel_files:
        os.remove(file)

    return send_file(zip_file_path, as_attachment=True, download_name=f'data-{requestid}.zip')
