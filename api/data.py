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
    selected_projectid = request.args.get('projectid', default=None)
    selected_year = request.args.get('year', default=None)

    if selected_projectid is None:
        selected_projectid = ','.join(pd.read_sql("SELECT * FROM lu_project", g.eng).projectid.tolist())
    if selected_year is None:
        selected_year = "2021,2022,2023,2024"


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
        if 'logger' not in label and 'toxicity' not in label and 'topography' not in label:
            dtypes.append(label) 

    # Create and sort the list for 'region'
    regions = df['region'].dropna().unique().tolist()
    regions.sort()

    # Create and sort the list for 'estuaryclass'
    estuary_classes = df['estuaryclass'].dropna().unique().tolist()
    estuary_classes.sort()

    # Create and sort the list for 'mpastatus'
    mpa_statuses = df['mpastatus'].dropna().unique().tolist()
    mpa_statuses.sort()

    # Create and sort the list for 'estuarytype'
    estuary_types = df['estuarytype'].dropna().unique().tolist()
    estuary_types.sort()

    # Create and sort the list for 'estuaryname'
    estuaries = df['estuaryname'].dropna().unique().tolist()
    estuaries.sort()

    data = {
        'regions': regions,
        'estuary_classes': estuary_classes,
        'mpa_statuses': mpa_statuses,
        'estuary_types': estuary_types,
        'estuaries': estuaries,
        'dtypes': dtypes,
        'projectids': selected_projectid.split(","),
        'years': selected_year.split(",")
    }

    return jsonify(data)


@data_api.route('/wq/regions', methods=['GET'])
def get_wq_regions():
    """Get distinct regions from water quality data"""
    try:
        qry = """
            SELECT DISTINCT region 
            FROM mvw_qa_raw_logger_combined_final
            WHERE region != 'Baja'
            ORDER BY region
        """
        df = pd.read_sql(qry, g.eng)
        regions = df['region'].dropna().unique().tolist()
        return jsonify({'regions': regions})
    except Exception as e:
        print(f"Error fetching WQ regions: {str(e)}")
        return jsonify({'error': str(e)}), 500


@data_api.route('/wq/sites', methods=['GET'])
def get_wq_sites():
    """Get sites for a specific region"""
    try:
        region = request.args.get('region')
        if not region:
            return jsonify({'error': 'Region parameter is required'}), 400
        
        qry = f"""
            SELECT DISTINCT siteid 
            FROM mvw_qa_raw_logger_combined_final
            WHERE region = '{region}'
            ORDER BY siteid
        """
        df = pd.read_sql(qry, g.eng)
        sites = df['siteid'].dropna().unique().tolist()
        return jsonify({'sites': sites})
    except Exception as e:
        print(f"Error fetching WQ sites: {str(e)}")
        return jsonify({'error': str(e)}), 500


@data_api.route('/wq/parameters', methods=['GET'])
def get_wq_parameters():
    """Get available parameters and date ranges for a specific region and site"""
    try:
        region = request.args.get('region')
        siteid = request.args.get('siteid')
        
        if not region or not siteid:
            return jsonify({'error': 'Region and siteid parameters are required'}), 400
        
        # Get all records for this region and site to find date ranges with available data
        qry = f"""
            SELECT 
                year,
                month,
                raw_chlorophyll,
                raw_conductivity,
                raw_depth,
                raw_do,
                raw_do_pct,
                raw_h2otemp,
                raw_orp,
                raw_ph,
                raw_pressure,
                raw_qvalue,
                raw_salinity,
                raw_turbidity
            FROM mvw_qa_raw_logger_combined_final
            WHERE region = '{region}' AND siteid = '{siteid}'
            ORDER BY year, month
        """
        df = pd.read_sql(qry, g.eng)
        
        # Get parameters with 'y' value (check all rows and combine)
        param_map = {
            'raw_chlorophyll': 'chlorophyll',
            'raw_conductivity': 'conductivity',
            'raw_depth': 'depth',
            'raw_do': 'do',
            'raw_do_pct': 'do_pct',
            'raw_h2otemp': 'h2otemp',
            'raw_orp': 'orp',
            'raw_ph': 'ph',
            'raw_pressure': 'pressure',
            'raw_qvalue': 'qvalue',
            'raw_salinity': 'salinity',
            'raw_turbidity': 'turbidity'
        }
        
        parameters = []
        available_dates = []
        
        if len(df) > 0:
            # Find all parameters that have at least one 'y'
            for col, param_name in param_map.items():
                if (df[col] == 'y').any():
                    parameters.append(param_name)
            
            # Find all year/month combinations where at least one parameter has 'y'
            for _, row in df.iterrows():
                has_data = False
                for col in param_map.keys():
                    if str(row[col]).lower() == 'y':
                        has_data = True
                        break
                
                if has_data:
                    available_dates.append({
                        'year': int(row['year']),
                        'month': int(row['month'])
                    })
        
        return jsonify({
            'parameters': parameters,
            'available_dates': available_dates
        })
    except Exception as e:
        print(f"Error fetching WQ parameters: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@data_api.route('/wq/data', methods=['POST'])
def get_wq_data():
    """Get water quality data for selected parameters and date range"""
    try:
        data = request.get_json()
        region = data.get('region')
        siteid = data.get('siteid')
        startdate = data.get('startdate')
        enddate = data.get('enddate')
        parameters = data.get('parameters', [])
        
        if not all([region, siteid, startdate, enddate, parameters]):
            return jsonify({'error': 'All parameters are required'}), 400
        
        # Build column list for selected parameters
        param_columns = []
        for param in parameters:
            param_columns.append(f'raw_{param.lower()}')
        
        columns_str = ', '.join(param_columns)
        
        qry = f"""
            SELECT 
                objectid,
                projectid,
                siteid,
                estuaryname,
                stationno,
                sensortype,
                sensorid,
                samplecollectiontimestamp,
                {columns_str}
            FROM vw_logger_raw_publish
            WHERE siteid = '{siteid}'
            AND samplecollectiontimestamp BETWEEN '{startdate}' AND '{enddate}'
            ORDER BY samplecollectiontimestamp
        """
        print(qry)
        df = pd.read_sql(qry, g.eng)
        print(f"Raw data rows: {len(df)}")
        
        # Convert timestamp to date for grouping
        df['samplecollectiontimestamp'] = pd.to_datetime(df['samplecollectiontimestamp'])
        df['date'] = df['samplecollectiontimestamp'].dt.date
        
        # Group by date and compute daily averages for parameter columns
        groupby_cols = ['date', 'siteid', 'estuaryname', 'projectid']
        
        # Create aggregation dict - average for parameter columns, first for others
        agg_dict = {}
        for col in param_columns:
            agg_dict[col] = 'mean'
        
        df_daily = df.groupby(groupby_cols, as_index=False).agg(agg_dict)
        
        # Rename date back to samplecollectiontimestamp for frontend compatibility
        df_daily = df_daily.rename(columns={'date': 'samplecollectiontimestamp'})
        
        print(f"Daily averaged rows: {len(df_daily)}")
        
        # Replace NaN with None (converts to null in JSON)
        df_daily = df_daily.where(pd.notna(df_daily), None)
        # Convert to dict for JSON response
        result = df_daily.to_dict('records')
        
        return jsonify({'data': result})
    except Exception as e:
        print(f"Error fetching WQ data: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

