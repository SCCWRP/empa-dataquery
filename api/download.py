import traceback
import pandas as pd
from flask import Blueprint, request, render_template, jsonify, g, current_app, send_file
import os
import json
from zipfile import ZipFile
from datetime import datetime
import time
import shutil
import psycopg2
from psycopg2 import sql
import datetime
from sqlalchemy import text

from .utils import *
from .mail import send_mail, data_receipt

META_DICT = {
    "grab_field": "Field Grab",
    "discretewq": "Discrete Water Quality",
    "sedchem_lab": "Sediment and Water Chemistry",
    "edna_field": "eDNA Field",
    "sedimentgrainsize_lab": "Sediment Grainsize",
    "benthicinfauna_lab": "Benthic Infauna Small",
    "benthiclarge": "Benthic Infauna Large",
    "macroalgae": "Macroalgae",
    "bruv_field": "BRUVs",
    "bruv_lab": "BRUVs",
    "fishseines": "Fish Seines",
    "crabtrap": "Crab Traps",
    "vegetation": "Marsh Plain Vegetation and Epifauna Surveys",
    "feldspar": "Feldspar",
    "trash": "Trash",
}



def get_column_comments(table_name, eng, schema='sde'):
    """
    Retrieve a dictionary mapping column names to comments for the given table.
    Adjust the schema name if needed.
    """
    sql = f"""
    SELECT 
        a.attname AS column_name, 
        pg_catalog.col_description(a.attrelid, a.attnum) AS column_comment
    FROM 
        pg_catalog.pg_attribute a
    JOIN 
        pg_catalog.pg_class c ON a.attrelid = c.oid
    JOIN 
        pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE 
        c.relname = '{table_name}'
        AND n.nspname = '{schema}'  -- change this if needed
        AND a.attnum > 0 
        AND NOT a.attisdropped;
    """
    # Return a dictionary: {column_name: column_comment}
    df_comments = pd.read_sql(sql, eng)
    return df_comments.set_index("column_name")["column_comment"].to_dict()

download = Blueprint('download', __name__, template_folder = 'templates')
@download.route('/downloaddata', methods = ['GET','POST'])
def download_data():
    
    eng = g.eng
    request_data = request.get_json()
    cleaned_data = {k: v for k, v in request_data.items() if v}

    region = cleaned_data['region']
    estuaryclass = cleaned_data['estuaryclass']
    mpastatus = cleaned_data['mpastatus']
    estuarytype = cleaned_data['estuarytype']
    estuaryname = cleaned_data['estuaryname']

    # Extract these separately since the WHERE clause is for the search table, not the main table.
    dtypes = cleaned_data.pop('dtype', None)
    projectids = cleaned_data.pop('projectid', None)
    years = cleaned_data.pop('year', None)
    user_name = cleaned_data.pop('user_name', None)
    user_email = cleaned_data.pop('user_email', None)
    user_affiliation = cleaned_data.pop('user_affiliation', None)
    
    projectids = "'" + "','".join(projectids) + "'"
    years = "'" + "','".join(years) + "'"

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
    xml_files = []
    projectid_list = []
    sql_queries = []

    for dtype in dtypes:
        true_dtype = find_key_by_label(current_app.data_config.get('DATASETS'), dtype)
        tbls = current_app.datasets.get(true_dtype, [])
        excel_file_path = os.path.join(export_path, f'{true_dtype}.xlsx')

        date_col_name = 'samplecollectiondate'
        
        # Use xlsxwriter engine to allow adding comments to header cells
        with pd.ExcelWriter(excel_file_path, engine="xlsxwriter") as writer:
            workbook = writer.book  # Get the workbook object

            for tbl in tbls:
                pkey = get_primary_key(tbl, eng)
                if tbl == 'tbl_protocol_metadata':
                    continue

                # Get the custom column order from your table 'column_order'
                cols = pd.read_sql(f"""
                    SELECT column_name 
                    FROM column_order 
                    WHERE table_name = '{tbl}' 
                    ORDER BY custom_column_position
                """, eng).column_name.tolist()

                # Build the main query for the table
                query = f"""
                    SELECT t.*,
                        s.region,
                        s.estuaryclass,
                        s.mpastatus,
                        s.estuarytype
                    FROM {tbl} t
                    JOIN search s ON t.estuaryname = s.estuaryname AND t.siteid = s.siteid
                """
                if where_clause:
                    query += (
                        f" WHERE {where_clause} AND t.projectid in ({projectids}) "
                        f"AND EXTRACT(YEAR FROM t.{date_col_name}) IN ({years})"
                    )

                print(query)
                sql_queries.append(query)
                df = pd.read_sql(query, eng)

                # Write to Excel (if no data, write a placeholder DataFrame)
                if df.empty:
                    empty_df = pd.DataFrame({'DATA_NOT_AVAILABLE_FOR_CURRENT_SELECTIONS': []})
                    empty_df.to_excel(writer, sheet_name=tbl, index=False)
                else:
                    # Arrange columns as desired
                    selected_cols = (
                        ['objectid'] +
                        [col for col in cols if (col in df.columns) and (col not in current_app.system_fields)] +
                        ['region', 'estuaryclass', 'mpastatus', 'estuarytype']
                    )
                    df = df[selected_cols]
                    projectid_list.extend(set(df['projectid'].tolist()))

                    # Write sorted DataFrame to Excel
                    df.sort_values(pkey).to_excel(writer, sheet_name=tbl, index=False)

                    # After writing, get the worksheet object to add header comments.
                    worksheet = writer.sheets[tbl]

                    # Retrieve column comments for this table from PostgreSQL.
                    col_comments = get_column_comments(tbl, eng, schema='sde')

                    # Define comment options with a fixed width/height.
                    # Adjust these values so that the comment box is large enough for long text.
                    comment_options = {"width": 300, "height": 100}

                    # Loop over DataFrame columns (headers are written in row 0) and add comments.
                    for col_idx, col_name in enumerate(df.columns):
                        comment = col_comments.get(col_name)
                        if comment:
                            worksheet.write_comment(0, col_idx, comment, comment_options)


        excel_files.append(excel_file_path)
        
        # Get the metadata type from META_DICT
        metadata_type = META_DICT.get(true_dtype)
        
        # Look for matching XML files in the metadata_files folder
        metadata_files_path = os.path.join(export_path, "metadata_files")
        projectid_list = list(set(projectid_list))
        # Iterate over the files in the metadata directory
        for file in os.listdir(metadata_files_path):
            if file.endswith(".xml") and isinstance(metadata_type, str) and metadata_type in file:
                if any(projectid.replace("'", "") in file for projectid in projectid_list):
                    metadata_file_path = os.path.join(metadata_files_path, file)
                    xml_files.append(metadata_file_path)


    zip_file_path = f'{export_path}/data-{requestid}.zip'
    with ZipFile(zip_file_path, 'w') as zipf:
        for file in excel_files + xml_files:
            zipf.write(file, os.path.basename(file))

    # Clean up Excel files after zipping
    for file in excel_files:
        os.remove(file)

    last_timestamp_downloaded = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    sessionid = str(int(time.time()))

    # Define connection parameters
    conn_params = {
        'dbname': os.environ.get('DB_NAME'),
        'user': os.environ.get('DB_USER'),
        'password': os.environ.get('PGPASSWORD'),
        'host': os.environ.get('DB_HOST'),
        'port': os.environ.get('DB_PORT')
    }

    # Logging analytics
    analytics = {
        'user_name': user_name,
        'user_email': user_email,
        'user_affiliation': user_affiliation,
        'sop_downloaded': ','.join([dtype.split(':')[0].strip() for dtype in dtypes]),
        'last_timestamp_downloaded': last_timestamp_downloaded,
        'sessionid': sessionid
    }
    
    conn = psycopg2.connect(**conn_params)
    cursor = conn.cursor()

    # SQL query with parameterized values
    query = """
        INSERT INTO admin_download_tool_analytics (
            user_name, 
            user_email, 
            user_affiliation, 
            sop_downloaded, 
            last_timestamp_downloaded, 
            sessionid
        ) VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (user_name, user_email, user_affiliation, sop_downloaded)
        DO UPDATE SET last_timestamp_downloaded = EXCLUDED.last_timestamp_downloaded,
                      sessionid = EXCLUDED.sessionid;
    """

    # Execute the query with the analytics data
    cursor.execute(query, (
        analytics['user_name'],
        analytics['user_email'],
        analytics['user_affiliation'],
        analytics['sop_downloaded'],
        analytics['last_timestamp_downloaded'],
        analytics['sessionid']
    ))

    # Commit the transaction
    conn.commit()

    # Close the cursor and connection
    cursor.close()
    conn.close()

    if user_email != 'test@sccwrp.org':
        data_receipt(
            send_from = current_app.mail_from,
            always_send_to = current_app.maintainers,
            login_name = user_name,
            login_email = user_email,
            login_affiliation = user_affiliation,
            dtype = dtypes,
            region = region,
            estuaryclass = estuaryclass,
            mpastatus = mpastatus,
            estuarytype = estuarytype,
            estuaryname = estuaryname,
            projectid = projectids,
            year = years,
            #originalfile = zip_file_path,
            originalfile = None,
            eng = g.eng,
            mailserver = current_app.config['MAIL_SERVER']
        )

    joined_sql_queries = "; ".join(sql_queries)

    # Return the list of SQL queries along with other information
    return jsonify({
        'sql_queries': joined_sql_queries,
        'message': 'Data download initiated successfully.',
        'filename': f'data-{requestid}.zip'
    })


@download.route('/downloadfile/<filename>', methods=['GET'])
def download_file(filename):
    export_path = os.path.join(os.getcwd(), "api", "export")
    file_path = os.path.join(export_path, filename)
    
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    else:
        return jsonify({'message': 'File not found.'}), 404
