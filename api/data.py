import traceback
import pandas as pd
from flask import Blueprint, request, render_template, jsonify, g, current_app
import os
import json

data_api = Blueprint('data_api', __name__, template_folder = 'templates')
@data_api.route('/populatedropdown', methods = ['GET'])
def populate_dropdown():
    print("inside populate dropdown")
    selected_region = request.args.get('region', default=None)
    selected_estuary_class = request.args.get('estuary_class', default=None)
    selected_mpa_status = request.args.get('mpa_status', default=None)
    selected_estuary_type = request.args.get('estuary_type', default=None)
    selected_estuary = request.args.get('estuary', default=None)

    query_conditions = []
    if selected_region:
        regions = "','".join(selected_region.split(','))
        query_conditions.append(f"region in ('{regions}')")
    if selected_estuary_class:
        estuary_classes = "','".join(selected_estuary_class.split(','))
        query_conditions.append(f"estuaryclass in ('{estuary_classes}')")
    if selected_mpa_status:
        mpa_statuses = "','".join(selected_mpa_status.split(','))
        query_conditions.append(f"mpastatus in ('{mpa_statuses}')")
    if selected_estuary_type:
        estuary_types = "','".join(selected_estuary_type.split(','))
        query_conditions.append(f"estuarytype in ('{estuary_types}')")
    if selected_estuary:
        estuaries = "','".join(selected_estuary.split(','))
        query_conditions.append(f"estuaryname in ('{estuaries}')")

    where_clause = " AND ".join(query_conditions)
    if where_clause:
        where_clause = "WHERE " + where_clause

    qry = f"""
        SELECT DISTINCT
            region,
            estuaryclass,
            mpastatus,
            estuarytype,
            estuaryname 
        FROM SEARCH
        {where_clause}
        ORDER BY
            region,
            estuaryclass,
            mpastatus,
            estuarytype,
            estuaryname
    """
    print(qry)
    df = pd.read_sql(qry, g.eng)
    
    dtypes = []
    for x in current_app.data_config.get('DATASETS').keys():
        label = current_app.data_config.get('DATASETS').get(x).get('label')
        if 'logger' not in label:
            dtypes.append(label) 

    data = {
        'regions': df['region'].dropna().unique().tolist(),
        'estuary_classes': df['estuaryclass'].dropna().unique().tolist(),
        'mpa_statuses': df['mpastatus'].dropna().unique().tolist(),
        'estuary_types': df['estuarytype'].dropna().unique().tolist(),
        'estuaries': df['estuaryname'].dropna().unique().tolist(),
        'dtypes': dtypes 
    }

    return jsonify(data)

