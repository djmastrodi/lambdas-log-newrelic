#!/bin/bash
ENVIRONMENT=$1
SOURCE=$(pwd)
REDUCELINE=2
echo "Source: $SOURCE"
echo "Numero de Redução de Linhas: $REDUCELINE"

cd "$SOURCE"
LINEHEADTOTAL=$(awk '/scripts/{ print NR; exit }' package.json)
echo "Numero Total de linhas: $LINEHEADTOTAL"

LINETOTAL=$(awk '/dependencies/{ print NR; exit }' package.json)
echo "$LINETOTAL"
LINEHEADTOTAL=$(expr $LINEHEADTOTAL - $REDUCELINE)
echo "Numero de linhas cmd Head:$LINEHEADTOTAL"

TOTALTAIL=$(expr $LINEHEADTOTAL - $LINETOTAL)
echo "numero total de linhas cmd tail:$TOTALTAIL"

TEXT=$(cat package.json | head -$LINEHEADTOTAL | tail -$TOTALTAIL)
echo  "Lista Dependencias: $TEXT"

TEXT=$(echo $TEXT | tr ":" "\n")

echo "$TEXT"

re='^[0-9]+$'

echo "criando package.json"

packagejson="{\n     \"name\": \"Jobsv3\",\n   \"description\": \"Jobs v3\",\n   \"version\": \"1.0.0\",\n \"license\": \"MIT\"\n}"

echo -e "$packagejson"

distFile=./dist/package.json

if [ -f "$distFile" ]; then
    rm -f $distFile
fi

echo -e "$packagejson" >> "$distFile"

chmod +x "$distFile"

echo "iniciando add de dependencias"

cd "dist"

echo -e "registry=https://registry.npmjs.org/\nalways-auth=false\n@solides-node:registry=https://gitlab.com/api/v4/projects/34574727/packages/npm/\n//gitlab.com/api/v4/projects/34574727/packages/npm/:_authToken=${CI_JOB_TOKEN}" >.npmrc

for line in $TEXT
do
    length=$(expr  length ${line})
    length=$(expr $length - 2)
    line=${line:1:$length}
    if  ! [[ ${line:0:1} == $re || $line == 'serverless' || $line == 'aws-sdk' || ${line:0:1} == '^' || ${line:0:1} == '~' || ${line:0:1} == '' ]]
    then
        echo "Add dependencia $line"
        echo "npm i $line"
        npm i $line
    fi
done