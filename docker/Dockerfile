# sccwrp/flask:loggerclipper
FROM python:3.9.12

# Install python packages
RUN pip install numpy scipy pandas ahpy sqlalchemy flask uwsgi openpyxl xlsxwriter ipython

# Remove the PostgreSQL specific package
# RUN pip install psycopg2

# Install system dependencies
RUN apt-get update && apt-get install -y apt-utils libpcre3 libpcre3-dev build-essential libssl-dev libffi-dev vim

# Clean up to reduce image size
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y libpq-dev
RUN pip install psycopg2
