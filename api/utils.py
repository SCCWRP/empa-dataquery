import pandas as pd


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
