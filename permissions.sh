#!/bin/bash
if [ -z "$1" ]
    then 
        editor="www-data"
else
    editor=$1
fi

DIRECTORY=$(cd `dirname $0` && pwd)
chown -R $editor.$editor $DIRECTORY;
chown -R www-data.$editor $DIRECTORY/api $DIRECTORY/src;
chmod -R 775 $DIRECTORY/api $DIRECTORY/src;
